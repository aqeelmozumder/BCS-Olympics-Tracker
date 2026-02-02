# 🏅 BCS Olympic Tracker

A real-time Olympic medal tracking dashboard built for **Brentwood College School**.

This application is designed to be displayed on digital signage screens (Xibo) around the campus and accessed via mobile devices by students and parents. It features a public-facing scoreboard and a secured admin panel for the Athletics Department to update counts instantly.

## 🚀 Features

* **Real-time Updates:** Powered by Firebase Firestore, changes appear instantly on all screens without refreshing.
* **BCS Theming:** Custom styled with Brentwood Navy & Red.
* **Responsive Design:** Looks great on 4K TV screens and mobile phones.
* **Admin Panel:** Secure login for staff to add countries, update medal counts, and manage the board.
* **Auto-Sorting:** Countries automatically rank based on Gold > Silver > Bronze.

## 🛠️ Tech Stack

* **Frontend:** Vue.js 3 + Vite
* **Styling:** CSS (Scoped) + FontAwesome
* **Backend:** Firebase (Firestore, Auth, Hosting)
* **CI/CD:** GitHub Actions (Auto-deploy on push)

## 📦 Setup & Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/aqeelmozumder/BCS-Olympics-Tracker.git](https://github.com/aqeelmozumder/BCS-Olympics-Tracker.git)
   cd BCS-Olympics-Tracker

2. **Install dependencies**
   ```bash
   npm install

3. **Run locally**
   ```bash
   npm run dev

## 🔐 Admin Access

To access the Admin Panel:
1. Click the **"Staff Login"** button in the header.
2. Enter the authorized Athletics credentials.
3. Use the **"Edit Mode"** to add countries or modify counts.

## ☁️ Deployment

This project uses **GitHub Actions** for Continuous Deployment.
* Any push to the `main` branch automatically triggers a build and deploys to Firebase Hosting.
* **Live URL:** [https://brentwood-olympics.web.app](https://brentwood-olympics.web.app)
