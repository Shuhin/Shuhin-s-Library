let mysql = require('mysql');

let express = require('express');

const multer = require('multer');

const ejs = require('ejs');

const path = require('path');

let bodyParser = require('body-parser');

let app = express();



let connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'Books'
});

const storage = multer.diskStorage({
  destination: './public/uploads',
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() +
      path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1000000
  },
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
}).single('bookImage');

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

app.set('view engine', 'ejs');

app.use(express.static('./public'));

app.use(function check(error, req, res, next) {
  connection.connect(function(error) {
    if (error) {
      res.writeHead(500, {
        'content-Type': 'text/plain'
      });
      res.end('500 Server Error, Something went wrong with the connection');
      console.log('Unexpected Connection problem ');
      connection.end();
    } else {
      console.log('Error in the query');
      res.writeHead(400, {
        'content-Type': 'text/plain'
      });
      res.end('400 Bad Request, Please check your query again');
      connection.end();
    }
  });
  next();
});

app.get('/book', function(req, res, next) {
  console.log('request was made: ' + req.url);
  connection.query("SELECT * FROM bookList ", function(error, rows) {
    if (error) {
      next (err);
      return;
    } else {
      //res.writeHead(200, {'content-type': 'application/json'});
      console.log('Successful query');
      //console.log(rows);''
      res.render('start',{data: rows});
    }
  });
});

app.get('/book/Add', function(req, res, next) {
      res.render('index');
});

app.get('/book/BookSummary/:title', function(req, res, next) {
  const title = req.params.title;
  connection.query(`Select * from bookList WHERE title= '${title}'`, (error, rows) => {
    if (error) {
      next (error);
      return;
    } else {
   res.render('BookSummary', {data: rows[0]});
 }
});
});

app.post('/upload', function(req, res, next) {
  upload(req, res, function(err) {
    if (err) {
      res.render('index', {
        msg: err
      });
    } else {
      if (req.file == undefined) {
        res.render('index', {
          msg: 'Error: No file Selected !'
        });
      } else {
        let values = {
          title: req.body.book_name,
          author: req.body.author_name,
          publisher: req.body.publisher_name,
          photo_path: req.file ? req.file.filename : 'default.png'
        };
        connection.query("INSERT INTO `bookList` SET ?", [values], function(error, result) {
          if (error) {
            next(error);
            return;
          } else {
            res.writeHead(200, {
              'content-type': 'application/json',
              'content-Type': 'text/plain'
            });
            console.log('Successful query');
            res.end('Successfully inserted');
          }
        });
      }
    }
  });
});

app.listen(4000, (err) => {
  console.log("Now listening to port 4000", err);
});
