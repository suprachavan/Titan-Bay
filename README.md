#Titan-bay 

Project 2 : A CSUF Craigslist Web Application

Submission by Team- Savage

Group Members: Duy Do, Supra Chavan, Edwin Diaz-Mendez, Juio Cruz, Niket Kothari 

#Run the web application directly-
https://csufcraigslist.herokuapp.com/

#Project Summary
Titan-bay is a Single Page Web application implemented using HTML, CSS, Semantic UI, jQuery, JavaScript, Konockout.js, Socket.io, Node.js and MongoDB.The application is deployed on cloud by means of Heroku, using mLab as a cloud hosted data store.

Titan-bay imitates the behavior of online websites like Craigslist or EBay providing platform for CSUF students where they can post their used stuff like cellphones, textbooks, etc. for sale. First-time users need to sign up on the website using CSUF student email address i.e. of the form ("xx@csu.fullerton.edu") after which they can log in for subsequent visits.User needs to login and can initiate the buying process by clicking the “place bid” button for a specific product/item that he is interested in. If another user wishes to buy the same product, he can place a bid on that product by entering the price greater than the last bidding price. The bidding process will continue until the seller/owner of the product decides to sell the product to highest bidder or the bidding price matches the selling price. When the seller clicks the “sell” button for a specific listing, the interested buyer is notified of seller’s email address and similarly, buyer acquires the email address of the seller. From this point onwards, buyer and seller can communicate with each other via email and decide on how to carry out the actual purchase. 

Similarly, logged in user can create a new listing for product which he wants to sell. For creating a new listing, user needs to enter the product/item name, selling price, bidding price. The description of the product and image is optional but recommended. He can also view his listings and corresponding number of bids and bid price. We have also offered delete functionality which enables the user to delete any listing from his current list. 

All the data pertaining to users and movies is stored at the back end in a MongoDB data store. Along with above functionality, the application supports number of features such as form validation for users, user authentication, real time interactions and page updates etc. All the data pertaining to users and movies is stored at the back end in a MongoDB data store.


#How to install and run through this repository

1. Clone the project directory from the github repository- https://github.com/jcruz1991/Project-2
2. Navigate to the home project directory and run `npm install`
3. Start up the MongoDB and server using command `foreman start`
4. Step 3 will give an error if MongoDB is already running. Please make sure that the process for MongoDB is already stopped before running the command in Step 3. In case of this error in Step 3, You may directly start up the server with `node server.js` command.
4. The server will be listening on localhost:3000
5. Navigate to localhost:3000 through your favorite browser

#Note: 

While running the application for the very first time, the home page may appear blank (with only header, footer, and menu bar present). This is because the data store is empty at the moment (i.e. no data about user or listings present).
In this case, sign up as a first-time user, log in to your account, create a few listings and then log out.
Hit refresh button on the browser and now the listings will appear on the home page.
