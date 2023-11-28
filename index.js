const express = require('express');
const app = express();
const cors = require('cors');
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
    await client.connect();


    const userCollection = client.db("parcelManagement").collection("users");
    const parcelCollection = client.db("parcelManagement").collection("parcels");


    // users api
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
    app.get('/parcels', async(req, res) => {
      const email = req.query.email;
      const query = {email: email};
      const result = await parcelCollection.find(query).toArray();
      res.send(result);
    })


    app.get('/parcels/:id', async(req, res) => {
      const id = req.params.id;
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


    // app.delete('/parcels/:id', async(req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) }
    //   const result = await parcelCollection.deleteOne(express.query);
    //   res.send(result);
    // })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
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