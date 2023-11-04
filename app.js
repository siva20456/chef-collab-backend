const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const bcrypt = require('bcrypt')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const app = express();
const port = process.env.PORT;

const authorizeTheUser = require('./Middlewares/Authorizing')

app.use(cors())
app.use(express.json())


// DataBase Connection starts


console.log(process.env.URL)
// Create a new MongoClient
const client = new MongoClient(process.env.URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// // Connect to the server
client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB', err);
  });
const db = client.db('ChefCollab');
// console.log(db.collection('Chefs').find())

// app.use((req, res, next) => {
//   client.connect().then(() => {
//     req.db = client.db('ChefCollab');
//     next();
//   }).catch(err => {
//     console.error('Error connecting to MongoDB', err);
//     next(err);
//   });
// });
// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin","http://localhost:3004");
//   res.header('Access-Control-Allow-Methods', 'GET, POST, UPDATE, DELETE, OPTIONS');
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept , Authorization");
//   next()
// });

// DataBase Connection Ends 


// Registration and Sign Functionalities

app.post('/register', async (req, res, next) => {
  try {
    console.log(req.body)
    const { fname, lname, name, password, age, mobile, email, location, specialty, gender } = req.body
    console.log(name, password, age, mobile)
    const db_user = await db.collection('Chefs').findOne({ "username": name })
    const mail_check = await db.collection('Chefs').findOne({ mail: email })
    // console.log(db_user)

    if (db_user === null && mail_check === null) {
      const hashed_password = await bcrypt.hash(password, 10)
      const feed = await db.collection('Chefs').insertOne({ f_name: fname, l_name: lname, username: name, password: hashed_password, age, mobile, mail: email, location, specialty, exp_salary: 0, experience: 0, prev_salary: 0, rating: 0, relocate: false, gender })
      const ffed1 = await db.collection('ChefPortfolios').insertOne({ username: name, mail: email, desc: '', isCompleted: false })
      console.log(feed)
      // res.status(200).send(feed)
      const payload = {
        mail: email
      }
      const jwt_token = jwt.sign(payload, `Secret Token`)
      res.send({ jwt_token })
      console.log(name)
    } else if (db_user !== null) {
      res.status(400).send({ error: 'Username is already in use' })
    } else if (mail_check !== null) {
      res.status(400).send({ error: 'Mail is already in use' })
    }
    else {
      res.status(400).send({ error: 'Try again with different values' })
    }
    // console.log(params.details)



  } catch (e) {
    console.error(e)
  }
})

app.post('/RestRegister', async (req, res, next) => {
  try {
    console.log(req.body)
    const { restaurantName, email, password, mobile } = req.body
    console.log(restaurantName, email, password)
    const db_user = await db.collection('Restaurants').findOne({ "name": restaurantName })
    const mail_check = await db.collection('Restaurants').findOne({ mail: email })
    // console.log(db_user)

    if (db_user === null && mail_check === null) {
      const hashed_password = await bcrypt.hash(password, 10)
      const feed = await db.collection('Restaurants').insertOne({ name: restaurantName, password: hashed_password, mobile, mail: email })
      const feed2 = await db.collection('RestPortfolios').insertOne({ name: restaurantName, mail: email, location: '', rating: 0, salaryMargin: 0, req: {}, mailVerification: false, desc: '', isCompleted: false, style: '' })
      console.log(feed)
      // res.status(200).send(feed)
      const payload = {
        mail: email
      }
      const jwt_token = jwt.sign(payload, `Secret Token`)
      res.send({ jwt_token })
      console.log(restaurantName)
    } else if (db_user !== null) {
      res.status(400).send({ error: 'Restaurant Name is already in use' })
    } else if (mail_check !== null) {
      res.status(400).send({ error: 'Mail is already in use' })
    }
    else {
      res.status(400).send({ error: 'Try again with different values' })
    }
    // console.log(params.details)



  } catch (e) {
    console.error(e)
  }
})

app.post('/login', async (req, res, next) => {
  try {
    const { mail, password } = req.body
    const user_data = await db.collection('Chefs').findOne({ "mail": mail })
    // res.send(user_data)
    console.log(user_data)
    if (user_data === null) {
      res.status(400).send({
        data: "User Not Found"
      })
    } else {
      const is_password_true = await bcrypt.compare(password, user_data.password)
      if (is_password_true === true) {
        const payload = {
          mail: mail
        }
        const jwt_token = jwt.sign(payload, `Secret Token`)
        res.send({ jwt_token })
        console.log(mail)
      } else {
        res.status(400).send({
          data: "Incorrect Password"
        })
      }
    }

  } catch (e) {
    console.error(e)
  }
})

app.post('/RestLogin', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user_data = await db.collection('Restaurants').findOne({ "mail": email })
    // res.send(user_data)
    console.log(user_data)
    if (user_data === null) {
      res.status(400).send({
        data: "Restaurant Not Found"
      })
    } else {
      const is_password_true = await bcrypt.compare(password, user_data.password)
      if (is_password_true === true) {
        const payload = {
          mail: email
        }
        const jwt_token = jwt.sign(payload, `Secret Token`)
        res.send({ jwt_token })
        console.log(email)
      } else {
        res.status(400).send({
          data: "Incorrect Password"
        })
      }
    }

  } catch (e) {
    console.error(e)
  }
})

// Registration and Sign Functionalities End Here 


// Retrieving chef & Restaurant data 

app.get('/chefData', async (req, res, next) => {
  try {
    const app_data = await db.collection('Chefs').find({}).toArray()
    res.status(200).send(app_data)
  } catch (e) {
    console.error(e)
  }
})

app.get('/restData', async (req, res, next) => {
  try {
    const app_data = await db.collection('Restaurants').find({}).toArray()
    res.status(200).send(app_data)
  } catch (e) {
    console.error(e)
  }
})

// Edns Here

// Retrieving Personal Data 

app.get('/getInfo', authorizeTheUser, async (req, res, next) => {
  try {
    const { mail } = req
    console.log(mail)
    const user_data = await db.collection('Chefs').findOne({ mail })
    const user_portfolio = await db.collection('ChefPortfolios').findOne({ mail })
    // console.log(user_data,user_portfolio)
    // console.log(user_data)
    res.status(200).send({ user_data, user_portfolio })
  } catch (e) {
    console.log(e)
    res.status(400)
  }
})


app.get('/getRestInfo', authorizeTheUser, async (req, res, next) => {
  try {
    const { mail } = req

    const user_data = await db.collection('Restaurants').findOne({ mail })
    const user_portfolio = await db.collection('RestPortfolios').findOne({ mail })
    console.log(user_data)
    // console.log()
    res.status(200).send({ user_data, user_portfolio })
  } catch (e) {
    console.log(e)
    res.status(400)
  }
})


// Updation of Data 

app.post('/updateRestPortfolio', authorizeTheUser, async (req, res, next) => {
  try {
    const { data, portfolio } = req.body
    const { mail } = req
    delete data._id 
    delete portfolio._id 
    const feed = await db.collection('Restaurants').updateOne({ mail: mail }, { $set: { ...data } })
    const feed1 = await db.collection('RestPortfolios').updateOne({ mail: mail }, { $set: { ...portfolio } })
    console.log(feed, feed1)
    if (feed.acknowledged && feed1.acknowledged) {
      res.status(200).send({ data: 'Updated Successful' })
    } else {
      res.status(401)
    }
  } catch (e) {
    console.log(e)
    res.status(400)
  }
})

app.post('/updateChefPortfolio', authorizeTheUser, async (req, res, next) => {
  try {
    const { data, portfolio } = req.body
    const { mail } = req
    delete data._id 
    delete portfolio._id 
    const feed = await db.collection('Chefs').updateOne({ mail: mail }, { $set: { ...data } })
    const feed1 = await db.collection('ChefPortfolios').updateOne({ mail: mail }, { $set: { ...portfolio } })
    console.log(feed, feed1)
    if (feed.acknowledged && feed1.acknowledged) {
      res.status(200).send({ data: 'Updated Successfull' })
    } else {
      res.status(401)
    }
  } catch (e) {
    console.log(e)
    res.status(400)
  }
})


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


module.exports = client
