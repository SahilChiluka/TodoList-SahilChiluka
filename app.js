//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

main().catch(err => console.log(err));
 
async function main() {
  await mongoose.connect('mongodb+srv://admin-sahil:test123@cluster0.d89byi4.mongodb.net/todolistDB');
}

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const itemsSchema = {
  name : String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todolist!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name : String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];

app.get("/", function(req, res) {

   Item.find({}).then(function (foundItems) {

    if(foundItems.length === 0) {
      Item.insertMany(defaultItems).then (function () {
            console.log("Successfully saved all items to DB.");
          });
          res.redirect("/");
    } else {
    res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
   });

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}).then(function(foundList) {

    if(!foundList) {
      const list = new List({
        name : customListName,
        items: defaultItems
      });
    
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }

  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  let listName = req.body.list;   
  if (listName) {     
    listName = listName.trim();   
  }

  const addItem = new Item ({
    name: itemName
  });

  if(listName === "Today") {
    addItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}).then(function(foundList) {
      foundList.items.push(addItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
   Item.findByIdAndRemove(checkedItemId).then(function() {
    console.log("Successfully deleted checked item.");
    res.redirect("/");
   });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function() {
      res.redirect("/" + listName);
    });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
