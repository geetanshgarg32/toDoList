//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB" , {useNewUrlParser: true})

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist"
});

const item2 = new Item({
  name: "Hit the + to add new task"
});

const item3 = new Item({
  name: "Hit - to delete any task"
});

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);


const defaultItems = [item1, item2, item3];




app.get("/", function(req, res) {

  Item.find()
    .then(function (items) 
    {
        if(items.length===0){
          Item.insertMany(defaultItems).then(()=>{
            console.log("Items inserted successfully");
          }).catch((error)=>{
            console.log(error);
          });
          res.redirect("/");
        }else{
          res.render("list", {listTitle: "Today", newListItems: items});
        }
      

    }).catch(function (err) {
        console.log(err);
}); 
  
});

app.get("/:customListName", (req,res)=>{
  const customListName =_.capitalize(req.params.customListName);
  List.findOne({name: customListName}).then(function(foundList){
    
      if(foundList===null){
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect("/"+customListName);
      }
      else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    
  });

  
})

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const userItem = new Item({
    name: itemName
  });

  if(listName==="Today"){
    userItem.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}).then(function(foundList){
      foundList.items.push(userItem);
      foundList.save();
      res.redirect("/"+listName);
  });

  }

});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName==="Today"){
    Item.deleteMany({_id: checkedItemId}).exec().then(
      ()=>{
          console.log("Deleted successfully");
          res.redirect("/");
      }).catch((error)=>{
          console.log(error);
      });
  }else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}}).then(()=>{
      res.redirect("/"+listName);
    });
  }

  

   

});



app.get("/about", function(req, res){
  res.render("about.ejs");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
