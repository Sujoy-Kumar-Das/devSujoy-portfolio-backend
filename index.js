const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const formatDate = require("./utils/formatData");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("my-portfolio");
    const myInfo = db.collection("myInfo");
    const services = db.collection("services");
    const skills = db.collection("skills");
    const projects = db.collection("projects");
    const projectDetails = db.collection("projectDetails");
    const social = db.collection("social");
    const blogs = db.collection("blogs");
    const blogDetails = db.collection("blogDetails");

    // about me
    app.get("/my-info", async (req, res) => {
      const result = await myInfo.findOne({});
      res.send({
        success: true,
        message: " My info fetched successfully.",
        data: result,
      });
    });

    app.get("/services", async (req, res) => {
      const result = await services.find({}).toArray();
      res.send({
        success: true,
        message: "services fetched successfully.",
        data: result,
      });
    });

    // get all skills
    app.get("/skills", async (req, res) => {
      const limit = Number(req.query.limit);
      let result;

      if (!limit) {
        result = await skills.find({}).toArray();
      }

      result = await skills.find({}).limit(limit).toArray();
      res.send({
        success: true,
        message: "Skills fetched successfully.",
        data: result,
      });
    });

    // create skills
    app.post("/skills", async (req, res) => {
      const result = await skills.insertOne(req.body);
      res.send({
        success: true,
        message: "Skills created successfully.",
        data: result,
      });
    });

    // update skills
    app.patch("/skills/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const updatedDoc = {
        $set: {
          data,
        },
      };
      const result = await skills.updateOne(
        { _id: new ObjectId(id) },
        updatedDoc,
        { upsert: true }
      );

      console.log(result);
      res.send({
        success: true,
        message: "Skills created successfully.",
        data: result,
      });
    });

    // delete skills
    app.delete("/skills/:id", async (req, res) => {
      const { id } = req.params;
      const result = await skills.deleteOne({
        _id: new ObjectId(id),
      });
      res.send({
        success: true,
        message: "Skills deleted successfully.",
        data: result,
      });
    });

    // create project
    app.post("/project", async (req, res) => {
      const projectData = req.body;

      const project = {
        title: projectData.title,
        live: projectData.live,
        image: projectData.image,
      };

      const createProject = await projects.insertOne(project);

      if (!createProject.insertedId) {
        res.send({
          success: false,
          message: "Something went wrong while creating project.",
        });
      }

      const projectDetail = {
        projectId: createProject.insertedId,
        description: projectData.description,
        code: projectData.code,
        features: projectData.features,
        technology: projectData.technology,
        images: projectData.images,
      };

      const result = await projectDetails.insertOne(projectDetail);
      res.send({
        success: true,
        message: "Projects created successfully.",
        data: result,
      });
    });
    // update skills
    app.patch("/project/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const updatedDoc = {
        $set: {
          ...data,
        },
      };
      const result = await projects.updateOne(
        { _id: new ObjectId(id) },
        updatedDoc,
        { upsert: true }
      );

      res.send({
        success: true,
        message: " project updated successfully.",
        data: result,
      });
    });

    // get all project
    app.get("/projects", async (req, res) => {
      const result = await projects.find({}).toArray();
      res.send({
        success: true,
        message: "Projects fetched successfully.",
        data: result,
      });
    });

    // project details
    app.get("/project/:id", async (req, res) => {
      const id = req.params.id;
      const query = { projectId: new ObjectId(id) };
      const project = await projects.findOne({ _id: new ObjectId(id) });
      const productDetail = await projectDetails.findOne(query);

      const result = { ...project, ...productDetail };
      res.send({
        success: true,
        message: "Project details fetched successfully.",
        data: result,
      });
    });

    // delete project
    app.delete("/project/:id", async (req, res) => {
      const id = req.params.id;
      const query = { projectId: new ObjectId(id) };
      const projectQuery = { _id: new ObjectId(id) };

      const isAvailable = await projects.findOne(projectQuery);

      if (!isAvailable) {
        return res.status(404).send({
          success: false,
          message: "Project not found",
        });
      }

      const deleteProject = await projects.deleteOne(projectQuery);

      if (!deleteProject.acknowledged) {
        return res.status(404).send({
          success: false,
          message: "Something went wrong! While deleting.",
          data: null,
        });
      }

      const result = await blogDetails.deleteOne(query);

      res.send({
        success: true,
        message: "Project Deleted successfully.",
        data: result,
      });
    });

    // social links
    app.get("/social-links", async (req, res) => {
      const result = await social.find({}).toArray();
      res.send({
        success: true,
        message: "Social link fetched successfully.",
        data: result,
      });
    });

    // create blogs
    app.post("/blogs", async (req, res) => {
      const blogData = req.body;

      const blog = {
        title: blogData.title,
        description: blogData.description,
        image: blogData.image,
        shortDescription: blogData.shortDescription,
      };

      const createBlog = await blogs.insertOne(blog);

      if (!createBlog.insertedId) {
        res.send({
          success: false,
          message: "Something went wrong while creating blog.",
        });
      }

      const blogDetail = {
        blogId: createBlog.insertedId,
        date: formatDate(new Date()),
        likes: 0,
      };

      const result = await blogDetails.insertOne(blogDetail);
      res.send({
        success: true,
        message: "Blog details created successfully.",
        data: result,
      });
    });

    // get blogs
    app.get("/blogs", async (req, res) => {
      const limit = Number(req.query.limit);
      let result;

      if (!limit) {
        result = await blogs.find({}).sort({ _id: -1 }).toArray();
      }

      result = await blogs.find({}).sort({ _id: -1 }).limit(limit).toArray();

      res.send({
        success: true,
        message: "Blogs fetched successfully.",
        data: result,
      });
    });

    // get single blog
    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { blogId: new ObjectId(id) };
      const blog = await blogs.findOne({ _id: new ObjectId(id) });
      const blogDetail = await blogDetails.findOne(query);

      const result = { ...blog, ...blogDetail };
      res.send({
        success: true,
        message: "blog details fetched successfully.",
        data: result,
      });
    });

    // update blog
    app.patch("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const updatedDoc = {
        $set: {
          ...data,
        },
      };
      const result = await blogs.updateOne(
        { _id: new ObjectId(id) },
        updatedDoc,
        { upsert: true }
      );

      res.send({
        success: true,
        message: "blog updated  successfully.",
        data: result,
      });
    });

    // delete blog
    app.delete("/blogs/:id", async (req, res) => {
      const { id } = req.params;
      const blogQuery = { _id: new ObjectId(id) };
      const query = { blogId: new ObjectId(id) };

      const isAvailable = await blogs.findOne(blogQuery);

      if (!isAvailable) {
        return res.status(404).send({
          success: false,
          message: "Blog not found.",
          data: isAvailable,
        });
      }
      const deleteBlog = await blogs.deleteOne(blogQuery);

      if (!deleteBlog.acknowledged) {
        return res.status(404).send({
          success: false,
          message: "Something went wrong! While deleting.",
          data: null,
        });
      }

      const result = await blogDetails.deleteOne(query);

      res.send({
        success: true,
        message: "Blog Deleted successfully.",
        data: result,
      });
    });
    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
