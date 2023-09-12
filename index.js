import express from "express";
import mongoose from "mongoose";
import _ from "lodash";
import "dotenv/config";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

const itemsSchema = new mongoose.Schema ({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const todo1 = new Item ({
  name: "Welcome to the To-do list application"
});

const todo2 = new Item ({
  name: 'Add notes by pressing the "Add" button'
});

const todo3 = new Item ({
  name: "<--- Check the box if you want to delete an item"
});

const defaultItems = [todo1, todo2, todo3];

const listSchema = new mongoose.Schema ({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", async (req, res) => {

  const foundItems = await Item.find({});

  if (foundItems.length === 0) {
    Item.insertMany(defaultItems);
  } else {
    res.render("index.ejs", {
      listTitle: "Today",
      newItemlist: foundItems
    });
  }
});

app.get("/:customListName", async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  const foundLists = await List.findOne({
    name: customListName
  });

  if (!foundLists) {
    List.create({ 
      name: customListName, 
      items: defaultItems
    });
    res.redirect("/" + customListName);
  } else {
    res.render("index.ejs", {
      listTitle: foundLists.name, newItemlist: foundLists.items
    });
  };

}); 


app.post("/", async (req, res) => {
  const getTask = req.body["toDo"];
  const listName = req.body["add"];
  
  Item.create({
    name: getTask
  });

  if (listName === "Today") {
    res.redirect("/");
  } else {
    await List.findOneAndUpdate({ name: listName }, {$push: { items: { name: getTask }}});
    res.redirect("/" + listName);
  }
});


app.post("/delete", async (req, res) => {
  const checkboxId = req.body["checkbox"];
  const listName = req.body["listName"];

  if (listName === "Today") {
    await Item.findByIdAndRemove(checkboxId);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate({ name: listName }, {$pull: { items: { _id: checkboxId }}});
    res.redirect("/" + listName);
  }
});


app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});


