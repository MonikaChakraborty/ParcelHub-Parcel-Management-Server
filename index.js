const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.63dg6sa.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    const userCollection = client.db("parcelManagement").collection("users");
    const parcelCollection = client.db("parcelManagement").collection("parcels");


     // jwt related api
     app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });


    // middlewares
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }

      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
   
      // next();
    }




    // users api
    app.get('/users', verifyToken, async(req, res) => {
      
      const result = await userCollection.find().toArray();
      // console.log(req.headers);
      res.send(result);
    })


    app.get('/users/admin/:email', verifyToken, async(req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.type === "admin";
      }
      res.send({ admin });
    })


    app.get('/users/deliveryMan/:email', verifyToken, async(req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let deliveryMan = false;
      if (user) {
        deliveryMan = user?.type === "deliveryMan";
      }
      res.send({ deliveryMan });
    })

    

    app.post('/users', async(req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })


    // parcels
    // app.get('/allParcels', async(req, res) => {
    //    const result = await parcelCollection.find().toArray();
    //   res.send(result);
    // })


    app.get('/allParcels', async (req, res) => {
      try {
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
    
        const dateQuery = {};
        if (startDate && endDate) {
          dateQuery.requestedDeliveryDate = {
            $gte: startDate,
            $lte: endDate,
          };
        }
    
        const result = await parcelCollection.find(dateQuery).toArray();
        res.send(result);
      } catch (error) {
        console.error('Error fetching parcels:', error);
        res.status(500).send('Internal Server Error');
      }
    });
    
    


    // app.get('/parcels', async(req, res) => {
    //   const email = req.query.email;
    //   const query = {email: email};
    //   const result = await parcelCollection.find(query).toArray();
    //   res.send(result);
    // })


    app.get('/parcels', async (req, res) => {
      const email = req.query.email;
      const bookingStatus = req.query.bookingStatus; // New line to get booking status
    
      // Build the query object based on email and booking status
      const query = {
        email: email,
        ...(bookingStatus && { bookingStatus: bookingStatus }),
      };
    
      try {
        const result = await parcelCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error('Error fetching parcels:', error);
        res.status(500).send('Internal Server Error');
      }
    });
    


    app.get('/parcels/:id', async(req, res) => {
      const id = req.params.id;
      // console.log(req.headers);
      const query = { _id: new ObjectId(id) }
      const result = await parcelCollection.findOne(query);
      res.send(result);
    })

    
    app.post('/parcels', async(req, res) => {
      const parcelItem = req.body;
      
      const result = await parcelCollection.insertOne(parcelItem);
      res.send(result);
    })


    app.patch('/parcels/:id', async(req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          phoneNumber: item.phoneNumber,
          parcelType: item.parcelType,
          parcelWeight: item.parcelWeight,
          receiverName: item.receiverName,
          receiverNumber: item.receiverNumber,
          requestedDeliveryDate: item.requestedDeliveryDate,
          latitude: item.latitude,
          longitude: item.longitude,
          deliveryAddress: item.deliveryAddress,
          price: item.price
        }
      }
      

      const result = await parcelCollection.updateOne(filter, updatedDoc)
      res.send(result);
    })

    app.patch('/parcelsCancel/:id', async(req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          bookingStatus: item.bookingStatus,
          
        }
      }

      const result = await parcelCollection.updateOne(filter, updatedDoc)
      res.send(result);
    })


    app.patch('/updateParcels/:id', async(req, res) => {
      const item = req.body;
      const id = req.params.id;
      console.log('Received ID:', id);
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          bookingStatus: item.bookingStatus,
          approximateDeliveryDate: item.approximateDeliveryDate,
          deliveryManId: item.deliveryManId,
          deliveryManEmail: item.deliveryManEmail
        }
      }

      const result = await parcelCollection.updateOne(filter, updatedDoc)
      res.send(result);
    })


    app.patch('/allUsers/admin/:email', async(req, res) => {
      const item = req.body;
      const email = req.params.email;
      const filter = { email: email }
      const updatedDoc = {
        $set: {
          type: 'admin'
        }
      }
      
      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result);
    })


    app.patch('/allUsers/deliveryMan/:email', async(req, res) => {
      const item = req.body;
      const email = req.params.email;
      const filter = { email: email }
      const updatedDoc = {
        $set: {
          type: 'deliveryMan'
        }
      }
      
      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result);
    })


    app.get('/stats', async(req, res) => {
      const users = await userCollection.estimatedDocumentCount();
      const parcels = await parcelCollection.estimatedDocumentCount();
      const deliveredParcelsCount = await parcelCollection.countDocuments({ bookingStatus: "delivered" });

      res.send({
        users,
        parcels,
        deliveredParcelsCount
      });
    })
    
    // app.patch('/users', async(req, res) => {
    //   const item = req.body;
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) }
    //   const updatedDoc = {
    //     $set: {
    //       name: item.displayName,
    //     }
    //   }
    //   const result = await userCollection.updateOne(filter, updatedDoc)
    //   res.send(result);
    // })




    // app.delete('/parcels/:id', async(req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) }
    //   const result = await parcelCollection.deleteOne(express.query);
    //   res.send(result);
    // })



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('parcel is on the way')
})


app.listen(port, () => {
    console.log(`Parcel is running on port ${port}`);
})