/* jshint browser: true, jquery: true, camelcase: true, indent: 2, undef: true, quotmark: single, maxlen: 80, trailing: true, curly: true, eqeqeq: true, forin: true, immed: true, latedef: true, newcap: true, nonew: true, unused: true, strict: true */

/* global ko: true */
/* global io: true */

/*
File- client side javascript
CPSC 473 Project 2: Sell-it-live (Craigslist)
Submitted by-
    Julio Cruz
    Edwin Diaz
    Supra Chavan
    Niket Kothari
    Duy Do
Email- supra.chavan@gmail.com
*/

var socket = io.connect(''); // this variable is required for socket.io
var myViewModel;
var biddingViewModel;
var userListViewModel;
var userBidOnViewModel;
var userG = '';

/**
 *Bid item functionality for logged in user
 *Input- sent as JSON data
 *Output- returns updated item ID.
 */
var callBidOnItem = function(item) {
    'use strict';
    var jsonStr = JSON.stringify({
        'itemID': item.ID(),
        'bidPrice': item.currentBidPrice(),
        'userName': item.lastBidder()
    });
    $.ajax({
        type: 'POST',
        data: jsonStr,
        dataType: 'json',
        contentType: 'application/json',
        url: 'http://localhost:3000/bidOnItem',
        success: function(data) {
                // emit item is bid
                console.log(data.Result);
                socket.emit('updateItem', item.ID());
            } //end success
    }); //end ajax
}; //end callBidOnItem

/**
 *Knockout viewmodel for placing bid on listing for logged in user
 *calls function callBidOnItem
 */
function BiddingViewModel() {
    'use strict';
    var self = this;
    self.biddingPrice = ko.observable();
    self.Name = ko.observable();
    self.currentBidPrice = ko.observable();
    self.lastBidder = ko.observable();
    self.newBidPrice = ko.observable();
    self.message = ko.observable();
    self.ID = ko.observable();

    /**
     *submitBtn funtion for submitting a bid on item. Bid must be higher
     *than the current bid price.
     */
    self.submitBtn = function() {
        console.log('submit bidding' + self.newBidPrice());
        var newPrice = self.newBidPrice();
        if (newPrice > self.currentBidPrice()) {
            self.currentBidPrice(self.newBidPrice());
            self.lastBidder(userG);
            self.message('Done!');
            callBidOnItem(self);
        } else {
            self.message('Please enter a bigger price');
        }
    }; //end function submitBtn()

    /**
     *currentProduct function for setting product details.
     *The new bid price must be higher by 1 from the current bid price.
     */
    self.currentProduct = function(item) {
        self.Name(item.itemName());
        self.ID(item.itemID());
        self.currentBidPrice(item.itemCurrentBidPrice());
        self.lastBidder(item.itemLastBidder());
        self.newBidPrice(self.currentBidPrice() + 1);
    }; //end function currentProduct()
} //end function BiddingViewModel()

/**
 *Delete listing functionality for a logged in user
 *
 */
var removeItem = function(itemToRemove) {
    'use strict';
    var itemToDelete = JSON.stringify({
        '_id': itemToRemove.itemID()
    });
    console.log('inside removeItem');
    $.ajax({
        type: 'POST',
        data: itemToDelete,
        dataType: 'json',
        contentType: 'application/json',
        url: 'http://localhost:3000/removeItem',
        success: function(deletedItem) {
                console.log('successfully deleted item' + deletedItem);
                ko.utils.arrayForEach(myViewModel.items(), function(i) {
                    if (i.itemID() === itemToRemove.itemID()) {
                        userListViewModel.userItemList.remove(i);
                        myViewModel.items.remove(i);
                        socket.emit('itemDeleted');
                    }
                }); //end arrayForEach
            } //end success
    }); //end ajax
}; //end removeItem

/**
 *Functionality to sell item/listing called on sellBtn click
 *
 */
var onSellItem = function(item) {
    'use strict';
    var itemToSell = JSON.stringify({
        '_id': item.itemID()
    });
    $.ajax({
        type: 'POST',
        data: itemToSell,
        dataType: 'json',
        contentType: 'application/json',
        url: 'http://localhost:3000/sellItem',
        success: function() {
                //succesfully sold item, emit to others
                socket.emit('itemDeleted');
            } //end success
    }); //end ajax
}; //end onSellItem

/**
 *knockout viewmodel for displaying/updating listings/items on home page
 *
 */
function ItemViewModel() {
    'use strict';
    var self = this;
    self.itemName = ko.observable('');
    self.itemImage = ko.observable('');
    self.itemPrice = ko.observable('');
    self.itemDescription = ko.observable('');
    self.itemID = ko.observable('');
    self.mUserName = ko.observable('');
    self.itemCurrentBidPrice = ko.observable(0);
    self.itemTotalBids = ko.observable(0);
    self.itemLastBidder = ko.observable('');
    self.isSold = ko.observable(false);
    self.interestedUsers = ko.observableArray();
    self.email = ko.observable();
    self.biddingBtn = function() {
        if (userG === '') {
            alert('Please log in first before bidding');
        } else if (userG === self.mUserName()) {
            alert('You cannot bid on your own item');
        } else {
            biddingViewModel.currentProduct(self);
            $('.bidding-modal').modal('show');
        }
    }; //end function biddingBtn()

    self.deleteItem = function() {
        console.log('delete item clicked');
        removeItem(self);
    };

    self.sellBtn = function() {
        console.log('sell item');
        onSellItem(self);
        self.isSold(true);
    };

    self.newItem = function(item) {
        self.itemName(item.itemName);
        self.itemImage('./images/' + item.itemImage);
        self.itemPrice(item.itemPrice);
        self.itemDescription(item.itemDescription);
        self.itemID(item._id);
        self.mUserName(item.mUserName);
        self.itemCurrentBidPrice(item.itemCurrentBidPrice);
        self.itemTotalBids(item.itemTotalBids);
        self.itemLastBidder(item.itemLastBidder);
        self.isSold(item.isSold);
        self.interestedUsers(item.mInterestedUsers);
    }; //end function newItem()

    self.updateItem = function(item) {
        self.itemCurrentBidPrice(item.itemCurrentBidPrice);
        self.itemLastBidder(item.itemLastBidder);
        self.itemTotalBids(item.itemTotalBids);
        self.isSold(item.isSold);
        self.interestedUsers(item.mInterestedUsers);
    }; //end function updateItem()
} //end ItemViewModel

/**
 *knockout viewmodel for updating the list of products/listings
 *
 */
function AppViewModel() {
    'use strict';
    var self = this;
    //List of answers from all users
    self.items = ko.observableArray();
    self.addItem = function(newItem) {
        var item = new ItemViewModel();
        item.newItem(newItem);
        self.items.push(item);
    };

    self.updateAnItem = function(item) {
        //search for the item using the item's id'
        ko.utils.arrayForEach(self.items(), function(i) {
            if (i.itemID() === item._id) {
                i.updateItem(item);
            }
        });
    };
} //end AppViewModel

/**
 *knockout viewmodel for updating the online users lists
 *
 */
function UserListViewModel() {
    'use strict';
    var self = this;
    self.userItemList = ko.observableArray();
} //end userListViewModel()


/**
 *knockout viewmodel for bids user has placed.
 *
 */
function UserBidOnViewModel() {
    'use strict';
    var self = this;
    self.bidItemList = ko.observableArray();
}

/**
 * Sign up functionality for first time user
 * Submits sign up form data to server as JSON
 * Input- Username, Email address, password
 * Output- on success, returns JSON message that user is added successfully.
 */
var callSignUpFunction = function() {
    'use strict';
    var uname = document.getElementsByName('uname')[0].value;
    var email = document.getElementsByName('email')[0].value;
    var pwd1 = document.getElementsByName('pwd1')[0].value;
    var jsonStr = JSON.stringify({
        'username': uname,
        'email': email,
        'password': pwd1
    });
    $.ajax({
        type: 'POST',
        data: jsonStr,
        dataType: 'json',
        contentType: 'application/json',
        url: 'http://localhost:3000/signup',
        success: function(data) {
                $('.result').html(data);
                $('.signup_form').trigger('reset');
                $('login_modal').modal('destroy');
            } //end success
    }); //end ajax
}; //end callSignUpFunction()

/**
 * Log in functionality for registered user
 * Submits login form data to server as JSON
 * Input- Username, password
 * Output- on success, diplays user profile,
 * returns user id generated by MongoDB
 */
var callLogInFunction = function() {
    'use strict';
    var ulname = document.getElementsByName('ulname')[0].value;
    var pwd = document.getElementsByName('pwd')[0].value;
    var jsonStr = JSON.stringify({
        'username1': ulname,
        'password1': pwd
    });
    $.ajax({
        type: 'POST',
        data: jsonStr,
        dataType: 'json',
        contentType: 'application/json',
        url: 'http://localhost:3000/login',
        success: function(data) {
                if (data.error) {
                    $('.result2').html(data.error);
                    $('.login_form').trigger('reset');
                } else { //successful log in
                    userG = data.username;
                    //emit new user logged in
                    socket.emit('newUser', data.username);

                    $('.result2').html(data);
                    $('.login_form').trigger('reset');
                    $('.login_modal').modal('hide');

                    $('.right_menu1').hide();
                    $('.userlbl').text(
                        'Welcome ' + data.username);

                    $('.userHeader').text('Welcome ' + data.username);
                    $('.userId').text(data.userid);
                    console.log(data.userid);
                    $('.userId').hide();
                    $('.right_menu2').show();
                    $('.ui.sidebar').sidebar('toggle');
                } //end else
            } //end success
    }); //end ajax
}; //end callLogInFunction

/**
 *Add item/create new listing functionality for logged in user
 *Input- form data
 *Output- success/error message
 */
var callAddItemFunction = function() {
    'use strict';

    var itemName = document.getElementsByName('itemname')[0].value;
    var itemPrice = document.getElementsByName('itemprice')[0].value;
    var itemBidPrice = document.getElementsByName('itemBidPrice')[0].value;
    var file = $('#image').get(0).files[0];
    var itemDescription = $('.itemDescription').val();
    var itemType = $('.selectType option:selected').text();
    var userID = $('span.userId').text();

    var formData = new FormData();
    formData.append('itemName', itemName);
    formData.append('itemPrice', itemPrice);

    formData.append('itemDescription', itemDescription);
    formData.append('itemType', itemType);
    formData.append('userId', userID);
    formData.append('isSold', false);

    if (itemBidPrice === null) {
        itemBidPrice = 0;
    }
    formData.append('itemBidPrice', itemBidPrice);

    var error = 0;
    if (file) {
        formData.append('itemImage', file.name);
        if (!file.type.match('image.*')) {
            console.log('<p> Images only. Select another file</p>');
            error = 1;
        } else if (file.size > 1048576) {
            console.log('<p> Too large Payload. Select another file</p>');
            error = 1;
        } else {
            formData.append('image', file, file.name);
        }
    } else {
        formData.append('itemImage', 'images.jpeg');
    }
    if (!error) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://localhost:3000/additems', true);
        xhr.send(formData);
        xhr.onload = function() {
            if (xhr.status === 200) {
                console.log('in xhr itemadded success: ');
                var response = JSON.parse(xhr.responseText);
                socket.emit('newItemAdded', response);

                // $('.result3').html(xhr.responseText);
                $('.additem_form').trigger('reset');
                $('.result3').html('Listing created successfully');
            } else {
                console.log('<p> Error in upload, try again.</p>');
                $('.result3').html('Error in upload, try again.');
            }
        };
    }
}; //end callAddItemFunction

/**
 *Functionality to get information of 1 user
 *Input- item/listing and username
 *Output- email address of user
 */
var callGetUserInfoFunction = function(item, userName) {
    'use strict';
    var jsonStr = JSON.stringify({
        'userName': userName
    });
    $.ajax({
        type: 'POST',
        data: jsonStr,
        dataType: 'json',
        contentType: 'application/json',
        url: 'http://localhost:3000/userInfo',
        success: function(data) {
                item.email(data.email);
            } //end success
    }); //end ajax
}; //end callGetInfoOfOneItemFunction

/**
 * Displays all items in user's list, for logged in user
 * Input- user id in JSON format as argument jsonStr
 */
var callShowListingsFor1User = function() {
    'use strict';
    userListViewModel.userItemList([]);
    ko.utils.arrayForEach(myViewModel.items(), function(i) {
        console.log(i.mUserName());
        if (i.mUserName() === userG) {
            callGetUserInfoFunction(i, i.itemLastBidder());
            userListViewModel.userItemList.push(i);
        }
    });

}; //end callShowListingsFor1User

/**
 * Displays all items that user is bidded on, for logged in user
 * Input- user id in JSON format as argument jsonStr
 */
var callShowUserBidOnItems = function() {
    'use strict';
    userBidOnViewModel.bidItemList([]);
    ko.utils.arrayForEach(myViewModel.items(), function(i) {
        if (i.interestedUsers() !== null) {
            var index = 0;
            for (index; index < i.interestedUsers().length; index++) {
                if (i.interestedUsers()[index] === userG) {
                    if (i.isSold()) {
                        if (i.itemLastBidder() === userG) {
                            i.Message = 'You have won the item. Contact ' +
                                i.mUserName();
                            callGetUserInfoFunction(i, i.mUserName());
                        } else {
                            i.Message = 'You have lost the item.';
                            i.email('');
                        }
                    } else {
                        i.Message = 'Item is still on sale';
                        i.email('');
                    }
                    userBidOnViewModel.bidItemList.push(i);
                    break;
                } //end outer-if
            } //end for
        } //end outermost if
    }); //end arrayForEach
}; //end callShowUserBidOnItems

/**
 *Function to update the list of item/listings
 *
 */
var updateItemView = function(itemList) {
    'use strict';
    for (var i = 0; i < itemList.length; i++) {
        myViewModel.addItem(itemList[i]);
    }
}; //end updateItemView

/**
 * Displays all posted listings
 * Input- None
 * Output- on success, returns listing information as data
 */
var callShowAllListingsFunction = function() {
    'use strict';
    $.ajax({
        type: 'GET',
        dataType: 'json',
        contentType: 'application/json',
        url: 'http://localhost:3000/ShowAll',
        success: function(data) {
                myViewModel.items([]);
                updateItemView(data.itemList);
            } //end success
    }); //end ajax
}; //end callShowAllListingsFunction

/**
 *Functionality to get information of 1 specific item/listing
 *Input- JSON data
 *Output- item/listing information
 */
var callGetInfoOfOneItemFunction = function(jsonStr) {
    'use strict';
    $.ajax({
        type: 'POST',
        data: jsonStr,
        dataType: 'json',
        contentType: 'application/json',
        url: 'http://localhost:3000/itemInfo',
        success: function(data) {
                myViewModel.updateAnItem(data);
            } //end success
    }); //end ajax
}; //end callGetInfoOfOneItemFunction

/**
 *Function to retrieve the list of online users
 *
 */
var getOnlineUsers = function() {
    'use strict';
    $.ajax({
        type: 'GET',
        dataType: 'json',
        contentType: 'application/json',
        url: 'http://localhost:3000/users',
        success: function(users) {
                for (var i = 0; i < users.length; i++) {
                    $('#onlineUsers').append(
                        $('<div class="small olUser header">').text(users[i]));
                }
            } //end success
    }); //end ajax
}; //end getOnlineUsers


var main = function() {
    'use strict';

    myViewModel = new AppViewModel();
    ko.applyBindings(myViewModel, document.getElementById('productList'));

    biddingViewModel = new BiddingViewModel();
    ko.applyBindings(biddingViewModel, document.getElementById('biddingModal'));

    userListViewModel = new UserListViewModel();
    ko.applyBindings(userListViewModel,
        document.getElementById('listOfUsersItems'));

    userBidOnViewModel = new UserBidOnViewModel();
    ko.applyBindings(userBidOnViewModel,
        document.getElementById('itemsbidonList'));


    // maybe change this to getlistings from online
    callShowAllListingsFunction();
    // get users that are online
    getOnlineUsers();

    socket.on('newUser', function(userName) {
        // append to user list?
        // need to add user list
        console.log('user id received on clients: ' + userName);
        $('#onlineUsers').append(
            $('<div class="small header">').text(userName));
    });

    socket.on('newItem', function(item) {
        // NOTE //
        //code to append to current item list goes here //
        var itemList = [item];
        console.log('item in newitem is: ' + item);
        updateItemView(itemList);
    });

    socket.on('userLeft', function(user) {
        var userListElements = document.getElementById('onlineUsers'),
            users = userListElements.getElementsByTagName('div');
        // loop through userList, remove user who left if found
        for (var i = 0; i < users.length; i++) {
            if (users[i].innerText === user) {
                userListElements.removeChild(users[i]);
                return;
            }
        }
    });

    socket.on('updateListing', function() {
        // update item list because an item was deleted
        callShowAllListingsFunction();
    });

    socket.on('updateItem', function(itemID) {
        // item was update, tell server
        callGetInfoOfOneItemFunction(JSON.stringify({
            'itemID': itemID
        }));
    });

    $('.right_menu2').hide();
    $('.right_menu1').show();
    $('.ui.sidebar').sidebar('toggle');

    $('.about').click(function() {
        $('.about_modal').modal('show');
    });

    $('.contact').click(function() {
        $('.contact_modal').modal('show');
    });

    $('.logout').click(function() {
        // socket.emit('logout', userG);
        socket.emit('logout');
        $('.right_menu2').hide();
        $('.right_menu1').show();
        $('.ui.sidebar').sidebar('toggle');
        $('.userHeader').text('');
        $('span.userId').empty();

    });

    $('.profile').click(function() {
        $('.ui.sidebar').sidebar('toggle');
    });

    $('.addItem').click(function() {
        $('.result3').empty();
        $('.additem_modal').modal('show');
        $('.selectType').dropdown();

    });

    // userlist modal
    $('.viewListing').click(function() {
        $('.usersListings-modal').modal('show');

        callShowListingsFor1User();
        // $('.movie_seg').show();
    });

    $('.viewItemsBidOn').click(function() {
        $('.itemsbidon-modal').modal('show');

        callShowUserBidOnItems();
    });

    $('.signup').click(function() {
        $('.result').empty();
        $('.signup_modal').modal('show');
    });

    $('.login').click(function() {
        $('.result2').empty();
        $('.login_modal').modal('show');
    });

    $('.login').on('click', function() {
        $('signup_modal').modal('hide');
        $('login_modal').modal('show');
    });

    $('.signup').on('click', function() {
        $('signup_modal').modal('show');
        $('login_modal').modal('hide');
    });

    // Item Modal
    $('.itemsList').on('click', '.product', function() {
        $('.product_modal').modal('show');
    });


    //Buying Item
    $('.buyItem').on('click', function() {
        alert('Congragulations you just bought an item');
    });


    /*FORM VALIDATION USING SEMANTIC UI VALIDATION RULES*/
    $('.login_form').form({
        fields: {
            ulname: {
                identifier: 'ulname',
                rules: [{
                    type: 'empty',
                    prompt: 'Please enter a username'
                }]
            },
            pwd: {
                identifier: 'pwd',
                rules: [{
                    type: 'empty',
                    prompt: 'Please enter a password'
                }]
            },
        }, //end fields
        onSuccess: function(event) {
                callLogInFunction();
                event.preventDefault();
                console.log('form valid');
                $('.result3').empty();
            } //end onSuccess
    }); //end login form validation

    $('.signup_form').form({
        fields: {
            username: {
                identifier: 'uname',
                rules: [{
                    type: 'empty',
                    prompt: 'Please enter a username'
                }]
            },
            email: {
                identifier: 'email',
                rules: [{
                    type: 'email',
                    prompt: 'Please enter a valid email address'
                }, {
                    type: 'regExp',
                    //referred from
                    //http://stackoverflow.com/questions/16200965/regular-expression-validate-gmail-addresses
                    value: '/^[a-z0-9](\.?[a-z0-9]){1,}@csu\.fullerton\.edu$/i',
                    prompt: 'Please enter a valid CSUF email address, e.g. in the format- xx@csu.fullerton.edu'
                }]
            },
            pwd1: {
                identifier: 'pwd1',
                rules: [{
                    type: 'empty',
                    prompt: 'Please enter a password'
                }, {
                    type: 'length[' + 6 + ']',
                    prompt: 'Your password must be at least 6 characters'
                }]
            },
            pwd2: {
                identifier: 'pwd2',
                rules: [{
                    type: 'empty',
                    prompt: 'Please enter a password'
                }, {
                    type: 'length[' + 6 + ']',
                    prompt: 'Your password must be at least 6 characters'
                }, {
                    type: 'match[pwd1]',
                    prompt: 'Passwords do not match'
                }]
            },
            terms: {
                identifier: 'chck',
                rules: [{
                    type: 'checked',
                    prompt: 'You must agree to the terms and conditions'
                }]
            }
        }, //end fields
        onSuccess: function(event) {
                callSignUpFunction();
                event.preventDefault();
                console.log('form valid');
            } //end onSuccess
    }); //end signup form validation

    $('.additem_form').form({
        fields: {
            itemname: {
                identifier: 'itemname',
                rules: [{
                    type: 'empty',
                    prompt: 'This field cannot be empty'
                }]
            },
            itemprice: {
                identifier: 'itemprice',
                rules: [{
                    type: 'empty',
                    prompt: 'This field cannot be empty'
                }, {
                    type: 'number',
                    prompt: 'this field should be numeric value'
                }]
            },
            itemBidPrice: {
                identifier: 'itemBidPrice',
                rules: [{
                    type: 'empty',
                    prompt: 'This field cannot be empty'
                }, {
                    type: 'number',
                    prompt: 'this field should be numeric value'
                }]
            }
        }, //end fields
        onSuccess: function(event) {
                callAddItemFunction();
                event.preventDefault();
                console.log('form valid');

            } //end onSuccess
    }); //end add item form validation
    /*END FORM VALIDATION */
}; //end main

$(document).ready(main);
