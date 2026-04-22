// ================= DEBUG =================
console.log("JS LOADED");
console.log(CONFIG);

// ================= SUPABASE =================
const client = supabase.createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_KEY
);

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("searchInput");

  if (input) {
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchBooks();
      }
    });

    // ✅ LOAD DEFAULT BOOKS
    loadDefaultBooks();
  }

  loadReviews();
  loadLibrary();
});

// ================= SEARCH (OPEN LIBRARY) =================
let cache = {}; // 👈 add this at TOP of file

async function searchBooks() {
  const query = document.getElementById("searchInput").value.trim();

  if (!query) return;

  // ✅ CACHE CHECK
  if (cache[query]) {
    console.log("Loaded from cache");
    displayBooks(cache[query]);
    return;
  }

  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`;

  const res = await fetch(url);
  const data = await res.json();

  cache[query] = data.docs; // ✅ SAVE CACHE

  displayBooks((data.docs || []).slice(0, 10)); // ✅ LIMIT RESULTS
}

// Make function accessible to button
window.searchBooks = searchBooks;

// ================= DISPLAY BOOKS =================

const container = document.getElementById("browseContainer");
container.innerHTML = "Loading...";
function displayBooks(books) {
  const container = document.getElementById("browseContainer");

  container.innerHTML = "";

  if (!books || books.length === 0) {
    container.innerHTML = "No books found";
    return;
  }

  books.forEach(book => {
    const title = book.title;
    const author = book.author_name?.join(", ") || "Unknown";

    const cover = book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
      : "";

    const div = document.createElement("div");
    div.className = "glass-card book-card";

    div.innerHTML = `
      <img class="book-cover" src="${cover}">
      <h3>${title}</h3>
      <p>${author}</p>
      <button class="button-gold">Add to Library</button>
    `;

    div.querySelector("button").addEventListener("click", () => {
      addToLibrary({
        title: title,
        authors: [author],
        imageLinks: { thumbnail: cover },
        description: ""
      });
    });

    container.appendChild(div);
  });
}

// ================= ADD TO LIBRARY =================

async function addToLibrary(book) {
  try {
    const { data: userData } = await client.auth.getUser();
    const user = userData?.user;

    if (!user) {
      alert("Please login first");
      return;
    }

    let bookId;

    // ✅ STEP 1: Check if book already exists in books table
    const { data: existingBook } = await client
      .from("books")
      .select("id")
      .eq("title", book.title)
      .single();

    if (existingBook) {
      bookId = existingBook.id;
    } else {
      const { data: newBook } = await client
        .from("books")
        .insert([
          {
            title: book.title,
            author: book.authors?.join(", "),
            cover: book.imageLinks?.thumbnail || "",
            description: book.description || ""
          }
        ])
        .select();

      bookId = newBook[0].id;
    }

    // ✅ STEP 2: Check if already in user's library
    const { data: existingEntry } = await client
      .from("library")
      .select("id")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .maybeSingle();

    if (existingEntry) {
      alert("This book is already in your library 📚");
      return;
    }

    // ✅ STEP 3: Insert into library
    const { error } = await client
      .from("library")
      .insert([
        {
          user_id: user.id,
          book_id: bookId,
          status: "want" ,
        }
      ]);

    if (error) {
      console.error(error);
      alert("Error adding book");
    } else {
      alert("Book added successfully!");
    }

  } catch (err) {
    console.error(err);
  }
}

// ================= LOAD LIBRARY =================

async function loadLibrary() {
  const container = document.getElementById("libraryContainer");
  if (!container) return;

  container.innerHTML = "Loading...";

  const { data: userData } = await client.auth.getUser();
  const user = userData?.user;

  if (!user) {
    container.innerHTML = "Please login to view your library";
    return;
  }

  const { data, error } = await client
    .from("library")
    .select(`
      id,
      status,
      books!library_book_id_fkey (
        title,
        author,
        cover
      )
    `)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    container.innerHTML = "Error loading books";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>No books in your library yet.</p>";
    return;
  }

  // ✅ Create shelves
  container.innerHTML = `
    <h2 class="shelf-title">📚 Want to Read</h2>
    <div id="wantShelf" class="grid"></div>

    <h2 class="shelf-title">📖 Reading</h2>
    <div id="readingShelf" class="grid"></div>

    <h2 class="shelf-title">✅ Finished</h2>
    <div id="finishedShelf" class="grid"></div>
  `;

  const wantShelf = document.getElementById("wantShelf");
  const readingShelf = document.getElementById("readingShelf");
  const finishedShelf = document.getElementById("finishedShelf");

  data.forEach(item => {
    const book = item.books;

    const div = document.createElement("div");
    div.className = "glass-card book-card";

    div.innerHTML = `
      <img class="book-cover" src="${book.cover || ''}">
      <h3>${book.title}</h3>
      <p>${book.author}</p>

      <select class="status-dropdown">
        <option value="want" ${item.status === "want" ? "selected" : ""}>📚 Want to Read</option>
        <option value="reading" ${item.status === "reading" ? "selected" : ""}>📖 Reading</option>
        <option value="finished" ${item.status === "finished" ? "selected" : ""}>✅ Finished</option>
      </select>

      <button class="button-gold">Remove</button>
    `;

    // ✅ STATUS CHANGE (smooth + correct)
    const dropdown = div.querySelector(".status-dropdown");

    dropdown.addEventListener("change", async () => {
  const newStatus = dropdown.value;

  console.log("Changing to:", newStatus, "for id:", item.id);

  const { error } = await client
    .from("library")
    .update({ status: newStatus })
    .eq("id", item.id);

  if (error) {
    console.error("Update failed:", error);
  } else {
    console.log("Update success");
    loadLibrary();
  }
});

    // ❌ DELETE
    div.querySelector("button").addEventListener("click", () => {
      deleteFromLibrary(item.id);
    });

    // ✅ Append to correct shelf
    if (item.status === "reading") {
      readingShelf.appendChild(div);
    } else if (item.status === "finished") {
      finishedShelf.appendChild(div);
    } else {
      wantShelf.appendChild(div);
    }
  });
}

// ================= REVIEWS =================

async function addReview() {
  const book = document.getElementById("reviewBook").value;
  const text = document.getElementById("reviewText").value;
  const rating = document.getElementById("rating").value;

  const { data: userData } = await client.auth.getUser();
  const user = userData.user;

  if (!book || !text) {
    alert("Fill all fields");
    return;
  }

  await client.from("reviews").insert([
    {
      user_id: user.id,
      book: book,
      review: text,
      rating: rating
    }
  ]);

  document.getElementById("reviewBook").value = "";
  document.getElementById("reviewText").value = "";

  loadReviews();
}

async function loadReviews() {
  const container = document.getElementById("reviewContainer");
  if (!container) return;

  const { data } = await client
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  container.innerHTML = "";

  data.forEach(r => {
    container.innerHTML += `
      <div class="glass-card">
        <h3>${r.book}</h3>
        <p>${r.review}</p>
        <p>${"⭐".repeat(r.rating || 0)}</p>
      </div>
    `;
  });
}

// ================= AUTH =================

// Signup
window.signup = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await client.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  const user = data.user;

  // ✅ SAVE TO profiles table
  await client.from("profiles").insert([
    {
      id: user.id,
      name: email   // or store separately
    }
  ]);

  alert("Signup successful!");
};

// Login
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Login successful!");
    window.location.href = "browse.html";
  }
};

// Get current user
async function getCurrentUser() {
  const { data } = await client.auth.getUser();
  return data.user;
}

// ================= DEFAULT BOOK LOADER =================

async function loadDefaultBooks() {
  const container = document.getElementById("browseContainer");
  if (!container) return;

  container.innerHTML = `
  <p style="opacity:0.7">Fetching books...</p>
`;

  try {
    // ✅ random popular books query
    const url = `https://openlibrary.org/search.json?q=bestseller`;

    const res = await fetch(url);
    const data = await res.json();

    // ✅ shuffle books
    const shuffled = data.docs.sort(() => 0.5 - Math.random());

    displayBooks(shuffled.slice(0, 10)); // show 10 random
  } catch (err) {
    console.error(err);
    container.innerHTML = "Failed to load books";
  }
}