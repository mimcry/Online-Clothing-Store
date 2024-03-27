import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bodyparser from "body-parser";
import nodemailer from "nodemailer";
const router = express.Router();
const app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use(cors());
app.use(bodyparser.urlencoded({ extended: true }));

mongoose
  .connect("mongodb://127.0.0.1/myLoginRegisterDB")
  .then(() => {
    console.log("sucess");
  })
  .catch((err) => {
    console.log("no connection");
  });

const userSchema = new mongoose.Schema({
  firstname: String,
  email: String,
  password: String,
});
const User = new mongoose.model("order", userSchema);
const historySchema = new mongoose.Schema({
  items: [
    {
      img: String,
      description: String,
      quantity: Number,
      price: Number,
    }
  ],
  user: {
    mail: String,
    name: String,
    number: String,
    address: String,
  },
});

// Create the History model
const History = mongoose.model('History', historySchema);

//routes
app.post("/login", (req, res) => {
  const { email, password,username } = req.body;

  // Find the user with the provided email
  User.findOne({ email: email })
    .then((user) => {
      if (user) {
        if (password === user.password) {
          if(username!=""){
            user = { ...user._doc, username };

          res.send({ message: "Login successfully",  navigate: "home",varient:"success",user });
         

        }else{
          res.send({ message: "set user name" ,varient:"error",  navigate: "login"});

      } }
          else {
          res.send({ message: "Password didn't match",varient:"error",  navigate: "login" });
        }
      } else {
        res.send({ message: "User not registered" ,varient:"error",  navigate: "login"});
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "An error occurred during login" });
    });
});

app.post("/register", async (req, res) => {
  const { firstname, lastname, email, password, address } = req.body;

  try {
    // Check if a user with the provided email already exists
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      // User already registered
      res.send({ message: "User already registered",variant:"error",navigate:"register" });
      return;
    }
    

    // If the user doesn't exist, create a new user
    const newUser = new User({
      firstname,
      lastname,
      email,
      password,
      address,
    });

    // Save the new user to the database
    await newUser.save();

    // User successfully registered
    res
      .status(200)
      .json({ message: "Successfully registered. Please log in now.",variant:"success",navigate:"login" });
  } catch (err) {
    // Handle any errors that occur during the process
    console.error(err);
    res.status(500).json({ message: "An error occurred during registration." });
  }
});
app.get("/contactus", async (req, res) => {
  res.sendFile(__dirname);
});

app.post("/contactus", async (req, res) => {
  const mai = req.body.mail;
  const na = req.body.name;
  const mes = req.body.message;
  var transporter = nodemailer.createTransport({
    service: "gmail",

    auth: { user: "salongautam4@gmail.com", pass: "pwwr wedf dqff sfha" },
  });
  var mailOptions = {
    from: "salongautam4@gmail.com.com",
    to: req.body.name,
    cc: "salongautam4@gmail.com",
    subject: "You have got a message from a costumer " + na,
    text: mes + mai,
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      res.send("mail send");
      console.log("email sent" + info.response);
    }
  });
  res.send({ message: mes });
});
app.post("/checkout", async (req, res) => {
  const { message, name, cartItems, number, address,mail } = req.body;
  const history = new History({
    items: cartItems.map((item) => ({
      img: item.img,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      Size:item.size,
      color:item.color
    })),
    user: { message, name, number, address,mail },
  });
  
  await history.save();
  
  const tableRows = cartItems.map((item) => {
    return `<tr>
      <td>${item.img}</td>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.Size}</td>
      <td>${item.color}</td>
      <td>Rs ${item.price}</td>
    </tr>`;
  });

  const emailContent = `
    <h1>Order Details form "${name}" should be delivered to " ${address}" and contact information : ${number}</h1>
    <h3>${message}</h3>
    <h2>List of cloths</h2>
    <table>
      <tr>
        <th>Image</th>
        <th>Name</th>
        <th>Quantity</th>
        <th>Size</th>
        <th>Color</th>
        <th>Price</th>


      </tr>
      ${tableRows.join("")}
    </table>
  `;

  // Configure your nodemailer and send the order confirmation email here
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "salongautam4@gmail.com",
      pass: "pwwr wedf dqff sfha",
    },
  });

  var mailOptions = {
    from:{ mail},
    to: "salongautam4@gmail.com", // Use the 'mail' field from the request

    subject: `${name} - Order Confirmation`,
    html: emailContent,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "An error occurred while sending the email" });
    } else {
      console.log("Email sent: " + info.response);
      res.json({ message:`order conformed ${history}`});
    }
  });

 
});

app.listen(9002, () => {
  console.log("BE started at port 9002");
});
