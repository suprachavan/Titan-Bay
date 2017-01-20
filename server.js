// {
//     "node": true,
//     "camelcase": true,
//     "indent": 4,
//     "undef": true,
//     "quotmark": "single",
//     "maxlen": 80,
//     "trailing": true,
//     "curly": true,
//     "eqeqeq": true,
//     "forin": true,
//     "immed": true,
//     "latedef": true,
//     "newcap": true,
//     "nonew": true,
//     "unused": true,
//     "strict": true
// }

/*global require*/

/*
File- server side javascript
CPSC 473 Project 2: Sell-it-live (Craigslist)
Submitted by-
    Julio Cruz
    Edwin Diaz
    Supra Chavan
    Niket Kothari
    Duy Do
Email- supra.chavan@gmail.com
*/

//Modules required to run the application
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var formidable = require('formidable');
var fs = require('fs-extra');

// variables for the app + socket.io
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
// var port = process.env.PORT || 3000;
var port = 3000;


mongoose.connect('mongodb://localhost/Project2');
// mongoose.connect('mongodb://admin:admin@ds119738.mlab.com:19738/csufcraigslist');

mongoose.set('debug', true);

var userSchema = new mongoose.Schema({
    userName: String,
    email: String,
    password: String
});

var itemSchema = new mongoose.Schema({
    itemName: String,
    itemPrice: Number,
    itemDescription: String,
    itemType: String,
    mUserId: String,
    mUserName: String,
    mInterestedUsers: [String],
    itemCurrentBidPrice: Number,
    itemTotalBids: Number,
    itemLastBidder: String,
    itemImage: String,
    isSold: Boolean
});

var UserDb = mongoose.model('user', userSchema);
var ItemDb = mongoose.model('item', itemSchema);

var onlineUsers = [];

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use("/", express.static("public"));

server.listen(port, function() {
    console.log('Server listening on port 3000.');
});

/**
 *Functions that will be called as part of socket
 *for real time updates
 */
io.on('connection', function(socket) {
    console.log('Not signed up user connected');

    // user has logged on
    socket.on('newUser', function(userName) {
        // write out on server side the user
        console.log('Logged inuser ID received on server : ' + userName);
        socket.userName = userName;
        onlineUsers.push(userName);

        // emit new user to all clients
        io.emit('newUser', userName);
    });

    socket.on('disconnect', function() {
        console.log('socket disconnected');

        //Check the socket
        if (socket.userName !== null) {
            //Remove the user from the online users list
            console.log('user disconnect' + socket.userName);
            onlineUsers.splice(onlineUsers.indexOf(socket.userName), 1);
            io.emit('userLeft', socket.userName);
        }
    });

    //user has logged out
    socket.on('logout', function() {
        socket.userId = null;
        //Remove the user from the online users list
        console.log('user disconnect');
        socket.disconnect();
    });

    socket.on('newItemAdded', function(itemData) {
        // tell everyone there's a new item from a logged in user
        io.emit('newItem', itemData);
    });

    socket.on('updateItem', function(itemID) {
        io.emit('updateItem', itemID);
    });

    socket.on('itemDeleted', function() {
        console.log('updateListing');
        io.emit('updateListing');
    });
}); //end io.on

/**
 *Route for remove item from user's account
 *
 */
app.post('/removeItem', function(req, res) {
    console.log('remove item = ');
    //Remove items of the users from the database
    ItemDb.remove({
        _id: req.body._id
    }, function(err, item) {
        if (err) {
            console.log('error while delete an item');
            res.json({
                'Result': 'Failed'
            });
        } else {

            res.json({
                'Result': 'successful'
            });
        }
    });
});

/**
 *Route for getting an user's email
 *
 */
app.post('/userInfo', function(req, res) {
    console.log("Get user info");
    UserDb.findOne({
        userName: req.body.userName
    }, function(err, user) {
        if (user) {
            console.log("Found user " + user.userName);
            res.json({
                'Result': 'successful',
                'email': user.email
            });
        }
    });
});

/**
 *Route for sell an item from user's account
 *
 */
app.post('/sellItem', function(req, res) {
    console.log('sell item = ');

    //Find the of the users from the database
    ItemDb.findOne({
        _id: req.body._id
    }, function(err, item) {
        if (err) {
            console.log('error while finding an item');
            res.json({
                'Result': 'Failed'
            });
        } else {

            //Got the item, now update the isSold
            ItemDb.update({
                _id: req.body._id
            }, {
                isSold: true
            }, function(err, item) {
                if (item) {
                    console.log(item);
                    res.json({
                        'Result': 'successful'
                    });
                }
            });
        }
    });
});


/**
 *Route for bidding on a posted item
 *
 */
app.post('/bidOnItem', function(req, res) {
    console.log('user bids on an item');

    //Find the item
    ItemDb.findOne({
        _id: req.body.itemID
    }, function(err, item) {
        var userName = req.body.userName;
        var bidPrice = req.body.bidPrice;
        var newTotalBids = item.itemTotalBids + 1;
        var iterestedUsers = item.mInterestedUsers;
        iterestedUsers.push(userName);

        //Update the item
        ItemDb.update({
            _id: req.body.itemID
        }, {
            itemCurrentBidPrice: bidPrice,
            itemTotalBids: newTotalBids,
            itemLastBidder: userName,
            mInterestedUsers: iterestedUsers
        }, function(err, success) {
            if (err) {
                console.log('Error when update item');
                res.json({
                    'Result': 'Failed'
                });
            } else {
                console.log('Successfully updated an item');
                res.json({
                    'Result': 'successful'
                });
            }
        }); //end function
    }); //end findOne
}); //end post


/*
 *Rote to retrieve information for specific item
 *
 */
app.post('/itemInfo', function(req, res) {
    ItemDb.findOne({
        _id: req.body.itemID
    }, function(err, item) {
        if (item) {
            console.log('Found item' + req.body.itemName);
            res.json(item);
        }
    }); //end findOne
}); //end post


/**
 * Route for signup functionality for first-time user
 *
 */
app.post('/signup', function(req, res) {
    console.log('inside post method');
    UserDb.findOne({
        userName: req.body.username
    }).exec(function(err, user) {
        if (!user) {
            var u1 = new UserDb({
                userName: req.body.username,
                password: req.body.password,
                email: req.body.email
            });
            u1.save(function(err, result) {
                if (err) {
                    console.log('error while signing up' + err);
                    res.json('error while signing up');
                } else {
                    console.log('user registered successfully');
                    res.json('user registered successfully');
                }
            });
        } else {
            console.log('user already exists');
            res.json('user already exists, please try again with diffrent user name');
        }
    }); //end findOne
}); //end post

/**
 * Route for login functionality for registered user
 *
 */
app.post('/login', function(req, res) {
    console.log('inside post-login method');
    UserDb.findOne({
        userName: req.body.username1
    }).exec(function(err, user) {
        if (!user) {
            console.log('user does not exist' + err);
            res.json({
                'error': 'user does not exist, please sign up first'
            });
        } else {
            if (user.password !== req.body.password1) {
                console.log('authentication failure');
                res.json({
                    'error': 'authentication failure, please check your details'
                });
            } else {
                console.log('user login successful');
                res.json({
                    'username': req.body.username1,
                    'userid': user._id
                });
            }
        }
    }); //end findOne
}); //end post

/**
 * Route for functionality to add an Item for logged-in user
 *
 */
app.post('/additems', function(req, res) {
    var form = new formidable.IncomingForm();
    //var fields;
    form.parse(req, function(err, fields, files) {
        console.log('files is: ');
        console.log(files);

        if (Object.keys(files).length !== 0) {
            console.log('in filelengthblock');
            console.log(files.image.path);

            var temp_path = files.image.path;
            // The file name of the uploaded file
            var file_name = files.image.name;
            // Location where we want to copy the uploaded file
            var new_location = 'public/images/';

            fs.copy(temp_path, new_location + file_name, function(err) {
                if (err) {
                    console.error(err);
                } else {
                    console.log("success!");
                    req.body = fields;

                    //var flagCounter = 0;
                    //var itemName = req.body.itemName;
                    //var itemPrice = req.body.itemPrice;
                    //var itemDescription = req.body.itemName;
                    //var itemType = req.body.itemName;
                    var uName;
                    UserDb.findOne({
                        _id: req.body.userId
                    }).exec(function(err, user) {
                        if (!user) {
                            console.log('user does not exist' + err);
                            res.json({
                                'error': 'user does not exist, please sign up first'
                            });
                        } else {
                            uName = user.userName;
                            var i1 = new ItemDb({
                                itemName: req.body.itemName,
                                itemPrice: req.body.itemPrice,
                                itemDescription: req.body.itemDescription,
                                itemType: req.body.itemType,
                                mUserName: uName,
                                mUserId: req.body.userId,
                                isSold: req.body.isSold,
                                itemCurrentBidPrice: req.body.itemBidPrice,
                                itemImage: req.body.itemImage,
                                itemTotalBids: 0,
                                itemLastBidder: null
                            });
                            // i1.mUserId.push(uName);
                            i1.save(function(err, result) {
                                if (err) {
                                    console.log('error while adding item To DBBB');
                                    res.json('error while adding item to db');
                                } else {
                                    console.log('item being added is: !!');
                                    console.log(result);
                                    console.log('listing added successfully');
                                    console.log('listing was added successfully to your List');
                                    res.json(result);
                                }
                            }); //end i1.save function
                        }
                    }); //end findOne
                } //end else
            }); //end fs.copy
        } else {
            console.log('no image file, use defailt');
            req.body = fields;

            //var itemName = req.body.itemName;
            //var itemPrice = req.body.itemPrice;
            //var itemDescription = req.body.itemName;
            //var itemType = req.body.itemName;
            var uName;
            UserDb.findOne({
                _id: req.body.userId
            }).exec(function(err, user) {
                if (!user) {
                    console.log('user does not exist' + err);
                    res.json({
                        'error': 'user does not exist, please sign up first'
                    });
                } else {
                    uName = user.userName;
                    var i1 = new ItemDb({
                        itemName: req.body.itemName,
                        itemPrice: req.body.itemPrice,
                        itemDescription: req.body.itemDescription,
                        itemType: req.body.itemType,
                        mUserName: uName,
                        mUserId: req.body.userId,
                        isSold: req.body.isSold,
                        itemCurrentBidPrice: req.body.itemBidPrice,
                        itemImage: req.body.itemImage,
                        itemTotalBids: 0,
                        itemLastBidder: null
                    });
                    // i1.mUserId.push(uName);
                    i1.save(function(err, result) {
                        if (err) {
                            console.log('error while adding item To DBBB');
                            res.json('error while adding item to db');
                        } else {
                            console.log('item being added is: !!');
                            console.log(result);
                            console.log('listing added successfully');
                            console.log('listing was added successfully to your List');
                            res.json(result);
                        }
                    }); //end i1.save function
                }
            }); //end findOne
        } //end else
    });
}); //end post

/**
 * Route for functionality to display all listings for 1 logged-in user
 *
 */
app.post('/showListingsFor1User', function(req, res) {
    console.log('in get all listings for 1 user');
    UserDb.findOne({
        _id: req.body.userID
    }).exec(function(err, user) {
        // user found, look for item
        ItemDb.find({
            mUserId: user._id
        }, {
            itemName: 1,
            itemPrice: 1,
            itemDescription: 1,
            itemType: 1,
            _id: 0
        }, function(err, items) {
            if (err) {
                console.log('error while showing listings for 1 user');
                res.json('error while showing listings for 1 user');
            } else {
                console.log(items);
                //res.json({ 'username': req.body.username1, 'userid': user._id, 'itemList': items });
                res.json({
                    'itemList': items
                });
            }
        }); //end find
    }); //end findOne
}); //end post

/**
 * Route for functionality to display all listings on home page
 *
 */
app.get('/ShowAll', function(req, res) {
    console.log('in get all listings');
    ItemDb.find({}, function(err, items) {
        if (err) {
            console.log('error while getting listing');
            res.json('error while getting listing');
        } else {
            console.log('in show all else');
            res.json({
                'itemList': items
            });
        }
    }); //end find
}); //end get

/**
 * Route for functionality to retrieve online users' list
 */
app.get('/users', function(req, res) {
    res.json(onlineUsers);
}); //end get
