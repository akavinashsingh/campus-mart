

# 🎓 CampusMart - College Marketplace

**CampusMart** is a full-stack MERN-style (using EJS) web application that allows college students to buy and sell used items within their campus. It features secure authentication, image uploads, and location-based mapping.

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

* **Node.js** (v18.0.0 or higher)
* **MongoDB Atlas** account (or a local MongoDB instance)
* **Cloudinary** account (for image storage)
* **Mapbox** account (for map features)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/akavinashsingh/campus-mart.git
cd campus-mart

```

### 2. Install Dependencies

This project uses several key packages for the MVC architecture. Run the following command to install them:

```bash
npm install

```

**Key Dependencies Installed:**
| Package | Purpose |
| :--- | :--- |
| **express** | Web framework for Node.js |
| **mongoose** | MongoDB object modeling (Models) |
| **ejs & ejs-mate** | Templating engine for the UI (Views) |
| **passport** | Authentication middleware |
| **cloudinary** | Cloud-based image management |
| **multer** | Middleware for handling file uploads |
| **mapbox-sdk** | Geocoding and map services |

---

### 3. Environment Variables Setup

Create a file named `.env` in the root directory and add your credentials. **Do not share this file.**

```env
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_key
CLOUD_API_SECRET=your_cloudinary_secret
MAP_TOKEN=your_mapbox_public_token
ATLASDB_URL=your_mongodb_atlas_connection_string
SECRET=a_long_random_string_for_sessions

```

---

### 4. Seed the Database (Optional)

If you want to start with some sample products, run the seed file:

```bash
node init/index.js

```

### 5. Run the Application

Start the server using `nodemon` for development:

```bash
npx nodemon app.js

```

The application will be live at `http://localhost:3000`.

---

## 🏗️ Project Structure (MVC)

The project follows a strict **Model-View-Controller** pattern:

* **/models**: Defines data schemas (User, Product, Review).
* **/views**: Contains EJS templates for the frontend interface.
* **/controllers**: Contains the logic that bridges Models and Views.
* **/routes**: Defines the application endpoints and connects them to controllers.
* **/public**: Static files (CSS, client-side JS, images).
* **/utils**: Custom error handling and async wrappers.

---

## 🛡️ Features

* **User Auth:** Signup/Login with `passport-local`.
* **CRUD Operations:** Create, Read, Update, and Delete product listings.
* **Image Uploads:** Seamless integration with Cloudinary.
* **Maps:** Visualizing product locations using Mapbox.
* **Reviews:** Students can leave ratings and comments on items.
* **Security:** Session encryption and flash message alerts.



Make sure your `.gitignore` file includes `.env` and `node_modules`. This prevents your private API keys and thousands of library files from being uploaded to the public internet.

