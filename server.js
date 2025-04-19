import express from 'express';
import cors from 'cors';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.FIREBASE_PROJECT_ID,
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
};

const firebaseApp = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Routes

// Vendors
app.get('/api/vendors', async (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      radius = 5, 
      minHygieneRating = 0,
      cuisine,
      category,
      sortBy = 'distance'
    } = req.query;

    let vendorsQuery = db.collection('vendors');
    
    // Apply hygiene rating filter
    if (minHygieneRating > 0) {
      vendorsQuery = vendorsQuery.where('hygieneRating', '>=', parseFloat(minHygieneRating));
    }
    
    // Apply cuisine filter if provided
    if (cuisine) {
      vendorsQuery = vendorsQuery.where('cuisine', '==', cuisine);
    }
    
    // Apply category filter if provided
    if (category && category !== 'All') {
      vendorsQuery = vendorsQuery.where('categories', 'array-contains', category.toLowerCase());
    }
    
    const vendorsSnapshot = await vendorsQuery.get();
    
    let vendors = [];
    vendorsSnapshot.forEach(doc => {
      vendors.push({ id: doc.id, ...doc.data() });
    });
    
    // Filter by distance if coordinates provided
    if (latitude && longitude) {
      const userLocation = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      };
      
      vendors = vendors.filter(vendor => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          vendor.location.latitude,
          vendor.location.longitude
        );
        
        vendor.distance = distance;
        return distance <= parseFloat(radius);
      });
    }
    
    // Sort results
    switch (sortBy) {
      case 'distance':
        vendors.sort((a, b) => a.distance - b.distance);
        break;
      case 'rating':
        vendors.sort((a, b) => b.rating - a.rating);
        break;
      case 'hygieneRating':
        vendors.sort((a, b) => b.hygieneRating - a.hygieneRating);
        break;
      default:
        vendors.sort((a, b) => a.distance - b.distance);
    }
    
    res.json(vendors);
  } catch (error) {
    console.error('Error getting vendors:', error);
    res.status(500).json({ error: 'Failed to get vendors' });
  }
});

app.get('/api/vendors/:id', async (req, res) => {
  try {
    const vendorDoc = await db.collection('vendors').doc(req.params.id).get();
    
    if (!vendorDoc.exists) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    res.json({ id: vendorDoc.id, ...vendorDoc.data() });
  } catch (error) {
    console.error('Error getting vendor:', error);
    res.status(500).json({ error: 'Failed to get vendor' });
  }
});

app.post('/api/vendors', authenticateUser, async (req, res) => {
  try {
    const vendorData = req.body;
    
    // Add additional fields
    const newVendorData = {
      ...vendorData,
      createdAt: new Date(),
      createdBy: req.user.uid,
      rating: 0,
      reviewCount: 0,
      favoriteCount: 0,
      favoriteUsers: [],
      // Create search keywords from name and cuisine
      searchKeywords: [
        ...vendorData.name.toLowerCase().split(' '),
        vendorData.cuisine.toLowerCase(),
        ...vendorData.address.area.toLowerCase().split(' ')
      ].filter(word => word.length > 2)
    };
    
    const docRef = await db.collection('vendors').add(newVendorData);
    
    res.status(201).json({ id: docRef.id, ...newVendorData });
  } catch (error) {
    console.error('Error adding vendor:', error);
    res.status(500).json({ error: 'Failed to add vendor' });
  }
});

// Reviews
app.get('/api/vendors/:id/reviews', async (req, res) => {
  try {
    const reviewsSnapshot = await db
      .collection('reviews')
      .where('vendorId', '==', req.params.id)
      .orderBy('createdAt', 'desc')
      .get();
    
    const reviews = [];
    
    for (const doc of reviewsSnapshot.docs) {
      const reviewData = { id: doc.id, ...doc.data() };
      
      // Get user data for each review
      const userDoc = await db
        .collection('users')
        .doc(reviewData.userId)
        .get();
      
      if (userDoc.exists) {
        reviewData.user = {
          uid: userDoc.id,
          displayName: userDoc.data().displayName,
          photoURL: userDoc.data().photoURL
        };
      } else {
        reviewData.user = {
          displayName: 'Anonymous User',
          photoURL: null
        };
      }
      
      reviews.push(reviewData);
    }
    
    res.json(reviews);
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

app.post('/api/reviews', authenticateUser, async (req, res) => {
  try {
    const reviewData = req.body;
    
    // Validate required fields
    if (!reviewData.vendorId || !reviewData.rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Add user ID from authenticated user
    reviewData.userId = req.user.uid;
    
    // Add timestamp
    reviewData.createdAt = new Date();
    reviewData.helpfulCount = 0;
    reviewData.helpfulUsers = [];
    
    // Start a batch write
    const batch = db.batch();
    
    // Create review document reference
    const reviewRef = db.collection('reviews').doc();
    batch.set(reviewRef, reviewData);
    
    // Update vendor document with new rating and review count
    const vendorRef = db.collection('vendors').doc(reviewData.vendorId);
    const vendorDoc = await vendorRef.get();
    
    if (vendorDoc.exists) {
      const vendorData = vendorDoc.data();
      const currentReviewCount = vendorData.reviewCount || 0;
      const currentRating = vendorData.rating || 0;
      
      // Calculate new average rating
      const newRating = ((currentRating * currentReviewCount) + reviewData.rating) / (currentReviewCount + 1);
      
      // Calculate new hygiene rating if provided
      if (reviewData.hygieneRating) {
        const currentHygieneReviewCount = vendorData.hygieneReviewCount || 0;
        const currentHygieneRating = vendorData.hygieneRating || 0;
        
        const newHygieneRating = ((currentHygieneRating * currentHygieneReviewCount) + reviewData.hygieneRating) / (currentHygieneReviewCount + 1);
        
        batch.update(vendorRef, {
          hygieneRating: parseFloat(newHygieneRating.toFixed(1)),
          hygieneReviewCount: currentHygieneReviewCount + 1
        });
      }
      
      // Update vendor with new rating and review count
      batch.update(vendorRef, {
        rating: parseFloat(newRating.toFixed(1)),
        reviewCount: currentReviewCount + 1
      });
    }
    
    // Update user's review count
    const userRef = db.collection('users').doc(req.user.uid);
    batch.update(userRef, {
      reviewCount: admin.firestore.FieldValue.increment(1)
    });
    
    // Commit the batch
    await batch.commit();
    
    res.status(201).json({ id: reviewRef.id, ...reviewData });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// Food Trails
app.get('/api/trails', async (req, res) => {
  try {
    const { category } = req.query;
    
    let trailsQuery = db.collection('foodTrails');
    
    if (category) {
      trailsQuery = trailsQuery.where('category', '==', category);
    }
    
    trailsQuery = trailsQuery.orderBy('createdAt', 'desc');
    
    const trailsSnapshot = await trailsQuery.get();
    
    const trails = [];
    trailsSnapshot.forEach(doc => {
      trails.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(trails);
  } catch (error) {
    console.error('Error getting food trails:', error);
    res.status(500).json({ error: 'Failed to get food trails' });
  }
});

app.get('/api/trails/:id', async (req, res) => {
  try {
    const trailDoc = await db.collection('foodTrails').doc(req.params.id).get();
    
    if (!trailDoc.exists) {
      return res.status(404).json({ error: 'Food trail not found' });
    }
    
    const trailData = { id: trailDoc.id, ...trailDoc.data() };
    
    // Get detailed vendor information for each stop
    const vendorDetails = await Promise.all(
      trailData.stops.map(async (stop) => {
        const vendorDoc = await db.collection('vendors').doc(stop.vendorId).get();
        
        if (vendorDoc.exists) {
          return {
            ...stop,
            vendor: { id: vendorDoc.id, ...vendorDoc.data() }
          };
        }
        
        return stop;
      })
    );
    
    trailData.stops = vendorDetails;
    
    res.json(trailData);
  } catch (error) {
    console.error('Error getting food trail:', error);
    res.status(500).json({ error: 'Failed to get food trail' });
  }
});

// User Profile
app.get('/api/profile', authenticateUser, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    res.json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

app.put('/api/profile', authenticateUser, async (req, res) => {
  try {
    const userData = req.body;
    
    // Update user profile in Firestore
    await db.collection('users').doc(req.user.uid).update({
      ...userData,
      updatedAt: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Helper function to calculate distance between two coordinates in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});