-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  review_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE
);

-- User Preferences Table
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  dietary_preference VARCHAR(50),
  UNIQUE(user_id, dietary_preference)
);

-- Favorite Cuisines Table
CREATE TABLE favorite_cuisines (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  cuisine VARCHAR(50),
  UNIQUE(user_id, cuisine)
);

-- Vendors Table
CREATE TABLE vendors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cuisine VARCHAR(100),
  is_vegetarian BOOLEAN DEFAULT FALSE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address_area VARCHAR(255),
  address_full TEXT,
  operating_hours TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  hygiene_rating DECIMAL(3, 2) DEFAULT 0,
  hygiene_review_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE
);

-- Vendor Categories Table
CREATE TABLE vendor_categories (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  category VARCHAR(50),
  UNIQUE(vendor_id, category)
);

-- Vendor Images Table
CREATE TABLE vendor_images (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Hygiene Details Table
CREATE TABLE vendor_hygiene (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  cleanliness DECIMAL(3, 2) DEFAULT 0,
  ingredients DECIMAL(3, 2) DEFAULT 0,
  water_safety DECIMAL(3, 2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Menu Items Table
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews Table
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  hygiene_rating INTEGER CHECK (hygiene_rating BETWEEN 1 AND 5),
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  helpful_count INTEGER DEFAULT 0
);

-- Review Images Table
CREATE TABLE review_images (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Helpful Reviews Table (to track which users found which reviews helpful)
CREATE TABLE helpful_reviews (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id, user_id)
);

-- Favorite Vendors Table
CREATE TABLE favorite_vendors (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id, user_id)
);

-- Food Trails Table
CREATE TABLE food_trails (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  short_description TEXT,
  category VARCHAR(50),
  duration VARCHAR(50),
  distance DECIMAL(5, 2),
  is_featured BOOLEAN DEFAULT FALSE,
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completion_count INTEGER DEFAULT 0
);

-- Food Trail Stops Table
CREATE TABLE food_trail_stops (
  id SERIAL PRIMARY KEY,
  trail_id INTEGER REFERENCES food_trails(id) ON DELETE CASCADE,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  description TEXT,
  recommended_items TEXT,
  UNIQUE(trail_id, stop_order)
);

-- Completed Trails Table
CREATE TABLE completed_trails (
  id SERIAL PRIMARY KEY,
  trail_id INTEGER REFERENCES food_trails(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trail_id, user_id)
);

-- Favorite Trails Table
CREATE TABLE favorite_trails (
  id SERIAL PRIMARY KEY,
  trail_id INTEGER REFERENCES food_trails(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trail_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_vendors_location ON vendors(latitude, longitude);
CREATE INDEX idx_vendors_cuisine ON vendors(cuisine);
CREATE INDEX idx_vendors_hygiene_rating ON vendors(hygiene_rating);
CREATE INDEX idx_reviews_vendor_id ON reviews(vendor_id);
CREATE INDEX idx_food_trail_stops_trail_id ON food_trail_stops(trail_id);

-- Create search index for vendor name and description
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_vendors_name_trgm ON vendors USING GIN (name gin_trgm_ops);
CREATE INDEX idx_vendors_description_trgm ON vendors USING GIN (description gin_trgm_ops);

-- Function to update vendor ratings when a review is added or updated
CREATE OR REPLACE FUNCTION update_vendor_ratings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update vendor rating
  UPDATE vendors
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE vendor_id = NEW.vendor_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE vendor_id = NEW.vendor_id
    )
  WHERE id = NEW.vendor_id;
  
  -- Update hygiene rating if provided
  IF NEW.hygiene_rating IS NOT NULL THEN
    UPDATE vendors
    SET 
      hygiene_rating = (
        SELECT COALESCE(AVG(hygiene_rating), 0)
        FROM reviews
        WHERE vendor_id = NEW.vendor_id AND hygiene_rating IS NOT NULL
      ),
      hygiene_review_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE vendor_id = NEW.vendor_id AND hygiene_rating IS NOT NULL
      )
    WHERE id = NEW.vendor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vendor ratings when a review is added
CREATE TRIGGER update_vendor_ratings_trigger
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_vendor_ratings();

-- Function to update user review count
CREATE OR REPLACE FUNCTION update_user_review_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET review_count = (
    SELECT COUNT(*)
    FROM reviews
    WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user review count when a review is added
CREATE TRIGGER update_user_review_count_trigger
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_user_review_count();

-- Function to update vendor favorite count
CREATE OR REPLACE FUNCTION update_vendor_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendors
  SET favorite_count = (
    SELECT COUNT(*)
    FROM favorite_vendors
    WHERE vendor_id = NEW.vendor_id
  )
  WHERE id = NEW.vendor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vendor favorite count when a favorite is added or removed
CREATE TRIGGER update_vendor_favorite_count_trigger
AFTER INSERT OR DELETE ON favorite_vendors
FOR EACH ROW
EXECUTE FUNCTION update_vendor_favorite_count();