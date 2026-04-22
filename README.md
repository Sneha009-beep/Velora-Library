# Velora Library 📚

A personal library web application where users can search, organize, and manage their reading collection with an elegant dark-themed interface.

---

## 🚀 Features

* 🔐 User Authentication (Signup/Login using Supabase)
* 🔍 Search books using Open Library API
* ➕ Add books to personal library
* 📚 Organize books into shelves:

  * Want to Read
  * Reading
  * Finished
* 💾 Persistent data storage (Supabase Database)
* 🎨 Clean dark-themed UI

---

## 🛠️ Tech Stack

* **Frontend**: HTML, CSS, JavaScript
* **Backend**: Supabase (Authentication + Database)
* **API**: Open Library API

---

## 📸 Screenshots

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">

  <img src="https://github.com/user-attachments/assets/b6472110-2a43-4b3a-abe3-a01dba53aa7e" />
  <img src="https://github.com/user-attachments/assets/68852874-9cb5-4af7-8318-bcfc9f9f3235" />

  <img src="https://github.com/user-attachments/assets/63055f11-940e-4107-9ce6-fdfd415eb561" />
  <img src="https://github.com/user-attachments/assets/aa88a3ea-b381-44a7-988e-1571d954b7ef" />

  <img src="https://github.com/user-attachments/assets/a983c400-0de3-4b0a-9a6a-5d81b57d96e3" />
  <img src="https://github.com/user-attachments/assets/d201b971-b064-4363-9ccb-d640b4c13588" />

</div>
---

## ⚙️ Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/your-username/velora-library.git
```

2. Open the project folder

3. Add your Supabase credentials in `config.js`:

```js
const CONFIG = {
  SUPABASE_URL: "your-url",
  SUPABASE_KEY: "your-anon-key"
};
```

4. Open `index.html` in your browser

---

## 🔐 Notes on Security

This project uses Supabase public (anon) keys.
Database access is protected using Row Level Security (RLS) policies.

---

## 🎯 Future Improvements

* 📊 Reading progress tracking
* 📖 Book details page
* 🔍 Search within library
* 🎨 UI enhancements

---

## 👩‍💻 Author

Sneha

---
