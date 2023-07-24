require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.Port || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Toy marketplace app is running");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ro7xucx.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const toys_collection = client.db("toy-cars").collection("toys");

    const indexKey = { name: 1 };
    const indexOption = { name: "toy_name" };
    await toys_collection.createIndex(indexKey, indexOption);

    app.post("/add-toys", async (req, res) => {
      const body = req.body;
      const result = await toys_collection.insertOne(body);
      res.send(result);
      console.log(result);
    });

    app.get("/allToys", async (req, res) => {
      const result = await toys_collection.find({}).toArray();
      res.send(result);
    });

    

    app.get("/allToys/:subCategory", async (req, res) => {
      // console.log(req.params.subCategory);
      const result = await toys_collection
        .find({
          sub_category: req.params.subCategory,
        })
        .toArray();
      res.send(result);
    });
  

    app.get("/view-details/:id", async (req, res) => {
      const toys = await toys_collection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(toys);
    });

    app.get("/myToys/:email", async (req, res) => {
      const result = await toys_collection
        .find({ seller_email: req.params.email })
        .toArray();
      res.send(result)
    })

    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const data = req.body;
      const result = await toys_collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            photo_url: data.photo_url,
            name: data.name,
            seller_name: data.seller_name,
            seller_email: data.seller_email,
            sub_category: data.sub_category,
            price: data.price,
            rating: data.rating,
            quantity: data.quantity,
            description: data.description,
          },
        },
        {
          upsert: true,
        }
      );
      res.send(result);
    });

    app.get("/sort", async (req, res) => {
      let sort_type = {};
      if (req.query?.sortby) {
        sort_type = { sort_by: req.query.sortby };
      }
      let query = {};
      if (req.query?.email) {
        query = { seller_email: req.query.email };
      }

      const asc_des = sort_type.sort_by === "ascending" ? 1 : -1;
      const toys = toys_collection.find(query, { sort: { price: asc_des } });
      const result = await toys.toArray();
      res.send(result);
    });


    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const result = await toys_collection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Toy marketplace listening on port ${port}`);
});
