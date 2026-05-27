<script>
  import { push } from "svelte-spa-router";
  import { onMount } from "svelte";
  import Swal from "sweetalert2";



  let currentUserName = "Loading...";
  let activeTab = "profile";

  let profile = { nama: "", email: "", phone: "", role: "Admin" };
  let password = { current: "", new: "", confirm: "" };

  let websiteSettings = { heroImage: null, aboutText: "", aboutImage: null, gallery: [] };
  let selectedFile = null;
  let filePreview = null;
  let isUploading = false;

  let selectedAboutFile = null;
  let aboutFilePreview = null;
  let isUploadingAbout = false;

  let aboutTextValue = "";
  let isSavingAboutText = false;

  let selectedGalleryFile = null;
  let galleryFilePreview = null;
  let galleryTitle = "";
  let isUploadingGallery = false;
  let isDeletingGalleryId = null;

  let subTab = "hero"; // 'hero', 'about', 'gallery'

  async function fetchWebsiteSettings() {
    try {
      const res = await fetch("http://localhost:9999/api/settings");
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          websiteSettings = result.data;
          aboutTextValue = result.data.aboutText || "";
        }
      }
    } catch (e) {
      console.error("Error fetching settings:", e);
    }
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          icon: "warning",
          title: "File Terlalu Besar",
          text: "Ukuran file maksimal adalah 2MB.",
          confirmButtonColor: "#0b5ba2"
        });
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: "warning",
          title: "Format Salah",
          text: "Format file harus JPG, JPEG, atau PNG.",
          confirmButtonColor: "#0b5ba2"
        });
        return;
      }

      selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        filePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async function uploadHeroImage() {
    if (!selectedFile) {
      Swal.fire({
        icon: "warning",
        title: "Pilih File",
        text: "Pilih file gambar terlebih dahulu!",
        confirmButtonColor: "#0b5ba2"
      });
      return;
    }

    isUploading = true;
    const formData = new FormData();
    formData.append("hero", selectedFile);

    try {
      Swal.fire({
        title: "Mengunggah Gambar...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const response = await fetch("http://localhost:9999/api/settings/hero", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Gambar dashboard berhasil diperbarui.",
          confirmButtonColor: "#0b5ba2",
          timer: 1500,
          showConfirmButton: false
        });
        websiteSettings = result.data;
        selectedFile = null;
        filePreview = null;
      } else {
        throw new Error(result.errors || "Gagal mengunggah gambar");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: error.message,
        confirmButtonColor: "#0b5ba2"
      });
    } finally {
      isUploading = false;
    }
  }

  function handleAboutFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          icon: "warning",
          title: "File Terlalu Besar",
          text: "Ukuran file maksimal adalah 2MB.",
          confirmButtonColor: "#0b5ba2"
        });
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: "warning",
          title: "Format Salah",
          text: "Format file harus JPG, JPEG, atau PNG.",
          confirmButtonColor: "#0b5ba2"
        });
        return;
      }

      selectedAboutFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        aboutFilePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async function uploadAboutImage() {
    if (!selectedAboutFile) {
      Swal.fire({ icon: "warning", title: "Pilih File", text: "Pilih file gambar About Us terlebih dahulu!", confirmButtonColor: "#0b5ba2" });
      return;
    }

    isUploadingAbout = true;
    const formData = new FormData();
    formData.append("about", selectedAboutFile);

    try {
      Swal.fire({
        title: "Mengunggah Gambar...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const response = await fetch("http://localhost:9999/api/settings/about-image", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Gambar About Us berhasil diperbarui.",
          confirmButtonColor: "#0b5ba2",
          timer: 1500,
          showConfirmButton: false
        });
        websiteSettings = result.data;
        selectedAboutFile = null;
        aboutFilePreview = null;
      } else {
        throw new Error(result.errors || "Gagal mengunggah gambar");
      }
    } catch (error) {
      console.error("About upload error:", error);
      Swal.fire({ icon: "error", title: "Gagal!", text: error.message, confirmButtonColor: "#0b5ba2" });
    } finally {
      isUploadingAbout = false;
    }
  }

  async function saveAboutText() {
    isSavingAboutText = true;
    try {
      Swal.fire({
        title: "Menyimpan Teks...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const response = await fetch("http://localhost:9999/api/settings/about-text", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ aboutText: aboutTextValue })
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Teks About Us berhasil disimpan.",
          confirmButtonColor: "#0b5ba2",
          timer: 1500,
          showConfirmButton: false
        });
        websiteSettings = result.data;
      } else {
        throw new Error(result.errors || "Gagal menyimpan teks");
      }
    } catch (error) {
      console.error("About text save error:", error);
      Swal.fire({ icon: "error", title: "Gagal!", text: error.message, confirmButtonColor: "#0b5ba2" });
    } finally {
      isSavingAboutText = false;
    }
  }

  function handleGalleryFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          icon: "warning",
          title: "File Terlalu Besar",
          text: "Ukuran file maksimal adalah 2MB.",
          confirmButtonColor: "#0b5ba2"
        });
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: "warning",
          title: "Format Salah",
          text: "Format file harus JPG, JPEG, atau PNG.",
          confirmButtonColor: "#0b5ba2"
        });
        return;
      }

      selectedGalleryFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        galleryFilePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async function uploadGalleryItem() {
    if (!selectedGalleryFile) {
      Swal.fire({ icon: "warning", title: "Pilih File", text: "Pilih file gambar galeri terlebih dahulu!", confirmButtonColor: "#0b5ba2" });
      return;
    }

    isUploadingGallery = true;
    const formData = new FormData();
    formData.append("galleryItem", selectedGalleryFile);
    formData.append("title", galleryTitle || "Foto Galeri");

    try {
      Swal.fire({
        title: "Menambahkan Foto...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const response = await fetch("http://localhost:9999/api/settings/gallery", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Foto berhasil ditambahkan ke galeri.",
          confirmButtonColor: "#0b5ba2",
          timer: 1500,
          showConfirmButton: false
        });
        websiteSettings = result.data;
        selectedGalleryFile = null;
        galleryFilePreview = null;
        galleryTitle = "";
      } else {
        throw new Error(result.errors || "Gagal menambahkan foto");
      }
    } catch (error) {
      console.error("Gallery upload error:", error);
      Swal.fire({ icon: "error", title: "Gagal!", text: error.message, confirmButtonColor: "#0b5ba2" });
    } finally {
      isUploadingGallery = false;
    }
  }

  async function deleteGalleryItem(id) {
    Swal.fire({
      title: "Hapus Foto ini?",
      text: "Foto ini akan dihapus permanen dari galeri.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Ya, Hapus!"
    }).then(async (r) => {
      if (r.isConfirmed) {
        isDeletingGalleryId = id;
        try {
          Swal.fire({
            title: "Menghapus Foto...",
            text: "Mohon tunggu sebentar",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
          });

          const response = await fetch(`http://localhost:9999/api/settings/gallery/${id}`, {
            method: "DELETE",
            credentials: "include"
          });

          const result = await response.json();

          if (response.ok) {
            Swal.fire({
              icon: "success",
              title: "Berhasil!",
              text: "Foto berhasil dihapus.",
              confirmButtonColor: "#0b5ba2",
              timer: 1500,
              showConfirmButton: false
            });
            websiteSettings = result.data;
          } else {
            throw new Error(result.errors || "Gagal menghapus foto");
          }
        } catch (error) {
          console.error("Delete gallery error:", error);
          Swal.fire({ icon: "error", title: "Gagal!", text: error.message, confirmButtonColor: "#0b5ba2" });
        } finally {
          isDeletingGalleryId = null;
        }
      }
    });
  }

  onMount(() => {
    const name = localStorage.getItem("user_name");
    if (name) {
      currentUserName = name;
      profile.nama = name;
      profile.email = name.toLowerCase().replace(/\s/g, "") + "@esport.com";
      profile.phone = "0812-3456-7890";
    } else {
      push("/");
    }

        if(localStorage.getItem("role") !== "admin"){
    Swal.fire({
        icon: 'error',
        title: 'Unauthorized',
        text: 'Redirecting......',
        confirmButtonColor: '#0b5ba2'
      }).then(() => {
        push('/user/absensi');
      });
  }

    const userStatus = localStorage.getItem("status");
    if(!userStatus){
      Swal.fire({
        icon: 'warning',
        title: 'Belum Verifikasi',
        text: 'Redirecting......',
        confirmButtonColor: '#0b5ba2'
      }).then(() => {
        push('/verification');
      });
      return;
    }
    fetchWebsiteSettings();
  });


  function saveProfile() {
    localStorage.setItem("user_name", profile.nama);
    currentUserName = profile.nama;
    Swal.fire({ icon: "success", title: "Profil berhasil disimpan!", confirmButtonColor: "#0a4682" });
  }

  function savePassword() {
    if (!password.current || !password.new || !password.confirm) {
      Swal.fire({ icon: "warning", title: "Lengkapi semua field!", confirmButtonColor: "#0a4682" });
      return;
    }
    if (password.new !== password.confirm) {
      Swal.fire({ icon: "error", title: "Password baru tidak cocok!", confirmButtonColor: "#0a4682" });
      return;
    }
    Swal.fire({ icon: "success", title: "Password berhasil diubah!", confirmButtonColor: "#0a4682" });
    password = { current: "", new: "", confirm: "" };
  }



  function handleLogout() {
    Swal.fire({
      title: "Yakin ingin keluar?", icon: "warning", showCancelButton: true,
      confirmButtonColor: "#ef4444", cancelButtonColor: "#9ca3af", confirmButtonText: "Ya, Logout!",
    }).then((r) => { if (r.isConfirmed) { localStorage.removeItem("user_name"); localStorage.removeItem("user_role"); push("/"); } });
  }

  let innerWidth = 0;
  let isSidebarOpen = true;
  $: if (innerWidth > 0 && innerWidth < 768) { isSidebarOpen = false; } else if (innerWidth >= 768) { isSidebarOpen = true; }
  function toggleSidebar() { isSidebarOpen = !isSidebarOpen; }

  let isDropdownOpen = false;
  function toggleDropdown() { isDropdownOpen = !isDropdownOpen; }
  function closeDropdown() { isDropdownOpen = false; }

  const tabs = [
    { id: "profile", label: "Profil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { id: "password", label: "Keamanan", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
    { id: "website", label: "Website", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" }
  ];
</script>

<svelte:window bind:innerWidth />

<div class="flex h-screen overflow-hidden font-sans bg-gray-50">
  {#if isSidebarOpen && innerWidth < 768}
    <div on:click={toggleSidebar} class="fixed inset-0 z-40 transition-opacity bg-black/50 backdrop-blur-sm" aria-hidden="true"></div>
  {/if}

  <aside class="{isSidebarOpen ? 'w-64' : 'w-0'} absolute md:relative z-50 overflow-hidden bg-[#0a2e52] text-white flex flex-col h-full shrink-0 shadow-xl transition-all duration-300 whitespace-nowrap">
    <div class="flex items-center justify-between px-6 py-8">
      <div class="flex items-center gap-3">
        <img src="src/assets/logo1.png" alt="logo" class="w-10 h-12 text-white" />
        <span class="text-2xl font-bold tracking-wider">E-Sport</span>
      </div>
      <button on:click={toggleSidebar} class="p-1 transition-colors rounded-md cursor-pointer md:hidden bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
    <nav class="flex-1 px-4 space-y-6 overflow-y-auto">
      <div>
        <p class="flex items-center gap-2 px-2 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          Dashboard
        </p>
        <button on:click={() => { window.location.href = '#/admin/beranda'; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">Beranda</button>
      </div>
      <div>
        <p class="flex items-center gap-2 px-2 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
          Management
        </p>
        <div class="flex flex-col gap-1">
          <button on:click={() => { window.location.href = '#/admin/anggota'; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">Anggota</button>
          <button on:click={() => { window.location.href = '#/admin/absensi'; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">Absensi</button>
          <button on:click={() => { window.location.href = '#/admin/analisis'; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">Analisis</button>
          <button on:click={() => { window.location.href = '#/admin/jadwal'; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">Jadwal</button>
        </div>
      </div>
      <div class="p-5">
        <button on:click={handleLogout} class="flex items-center justify-center w-full py-2.5 text-sm font-semibold text-white transition-colors bg-red-600 rounded-lg shadow-md hover:bg-red-700">Logout</button>
      </div>
    </nav>
  </aside>

  <div class="flex flex-col flex-1 h-full overflow-hidden">
    <header class="flex items-center justify-between h-16 px-4 sm:px-8 transition-all duration-300 bg-white border-b border-gray-200 shadow-sm shrink-0 z-10">
      <div class="flex items-center gap-3 text-gray-600">
        <button on:click={toggleSidebar} class="flex items-center justify-center p-1.5 transition-colors rounded-md cursor-pointer hover:bg-gray-100 text-gray-800">
          <svg class="w-5 h-5" stroke-width="2" viewBox="0 0 48 48"><path fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M7.95 11.95h32m-32 12h32m-32 12h32" /></svg>
        </button>
        <h1 class="hidden text-base font-bold text-gray-700 md:block">Settings</h1>
      </div>
      <div class="relative">
        <button on:click={toggleDropdown} class="flex items-center gap-2 px-2 py-1 transition-colors rounded-md cursor-pointer md:gap-3 hover:bg-gray-50 focus:outline-none">
          <img src="src/assets/profile.svg" alt="{currentUserName}" class="w-11 h-11 rounded-full" />
          <span class="text-sm font-bold text-gray-700">{currentUserName}</span>
          <svg class="w-4 h-4 text-gray-400 transition-transform duration-200 {isDropdownOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
        {#if isDropdownOpen}
          <div class="fixed inset-0 z-40" on:click={closeDropdown} aria-hidden="true"></div>
          <div class="absolute right-0 z-50 w-48 py-2 mt-2 bg-white border border-gray-100 rounded-lg shadow-lg">
            <button on:click={() => { closeDropdown(); }} class="flex items-center w-full gap-2 px-4 py-2.5 text-sm text-gray-700 transition-colors text-left hover:bg-gray-50">
              <img class="w-4 h-4" src="src/assets/setting.svg" alt="Settings" /> Settings
            </button>
            <div class="w-full h-px my-1 bg-gray-100"></div>
            <button on:click={handleLogout} class="flex items-center w-full gap-2 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors text-left hover:bg-red-50">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Logout
            </button>
          </div>
        {/if}
      </div>
    </header>

    <main class="flex-1 p-4 overflow-x-hidden overflow-y-auto sm:p-6 lg:p-10 bg-gray-50">
      <div class="max-w-4xl mx-auto space-y-6">

        <div>
          <h2 class="text-2xl font-extrabold text-gray-800 lg:text-3xl">Settings</h2>
          <p class="mt-1 text-sm text-gray-500">Kelola akun dan preferensi Anda</p>
        </div>

        <!-- Profile Card Top -->
        <div class="relative p-6 overflow-hidden text-white shadow-lg sm:p-8 bg-gradient-to-r from-[#0a4682] to-[#126bc2] rounded-2xl">
          <div class="relative z-10 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div class="flex items-center justify-center w-20 h-20 text-3xl font-black rounded-full bg-white/20 border-2 border-white/40 shrink-0">
              {currentUserName.charAt(0).toUpperCase()}
            </div>
            <div class="text-center sm:text-left">
              <h3 class="text-xl font-bold sm:text-2xl">{currentUserName}</h3>
              <p class="text-sm text-blue-200">{profile.role} • E-Sport PGRI</p>
              <p class="mt-1 text-xs text-blue-300">{profile.email}</p>
            </div>
          </div>
          <div class="absolute w-64 h-64 bg-white rounded-full opacity-5 -right-10 -top-20 blur-2xl pointer-events-none"></div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 p-1 bg-white border border-gray-200 shadow-sm rounded-xl">
          {#each tabs as tab}
            <button
              on:click={() => activeTab = tab.id}
              class="flex items-center justify-center flex-1 gap-2 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all {activeTab === tab.id ? 'bg-[#0a4682] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d={tab.icon} /></svg>
              <span class="hidden sm:inline">{tab.label}</span>
            </button>
          {/each}
        </div>

        <!-- Tab Content -->
        {#if activeTab === "profile"}
          <div class="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
            <div class="px-5 py-4 border-b border-gray-100 sm:px-6">
              <h3 class="text-lg font-bold text-gray-800">Informasi Profil</h3>
              <p class="text-sm text-gray-500">Perbarui informasi pribadi Anda</p>
            </div>
            <div class="p-5 space-y-5 sm:p-6">
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label for="nama" class="block mb-1.5 text-sm font-semibold text-gray-700">Nama Lengkap</label>
                  <input id="nama" type="text" bind:value={profile.nama} class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label for="role" class="block mb-1.5 text-sm font-semibold text-gray-700">Role</label>
                  <input id="role" type="text" value={profile.role} disabled class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                </div>
              </div>
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label for="email" class="block mb-1.5 text-sm font-semibold text-gray-700">Email</label>
                  <input id="email" type="email" bind:value={profile.email} class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label for="phone" class="block mb-1.5 text-sm font-semibold text-gray-700">No. Telepon</label>
                  <input id="phone" type="text" bind:value={profile.phone} class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>
              <div class="flex justify-end pt-2">
                <button on:click={saveProfile} class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-[#0a4682] rounded-lg shadow-md hover:bg-[#0c5599] active:scale-95">Simpan Profil</button>
              </div>
            </div>
          </div>

        {:else if activeTab === "password"}
          <div class="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
            <div class="px-5 py-4 border-b border-gray-100 sm:px-6">
              <h3 class="text-lg font-bold text-gray-800">Ubah Password</h3>
              <p class="text-sm text-gray-500">Pastikan password Anda aman</p>
            </div>
            <div class="p-5 space-y-5 sm:p-6">
              <div>
                <label for="currentPw" class="block mb-1.5 text-sm font-semibold text-gray-700">Password Saat Ini</label>
                <input id="currentPw" type="password" bind:value={password.current} class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Masukkan password saat ini" />
              </div>
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label for="newPw" class="block mb-1.5 text-sm font-semibold text-gray-700">Password Baru</label>
                  <input id="newPw" type="password" bind:value={password.new} class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Masukkan password baru" />
                </div>
                <div>
                  <label for="confirmPw" class="block mb-1.5 text-sm font-semibold text-gray-700">Konfirmasi Password</label>
                  <input id="confirmPw" type="password" bind:value={password.confirm} class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Ulangi password baru" />
                </div>
              </div>
              <div class="flex justify-end pt-2">
                <button on:click={savePassword} class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-[#0a4682] rounded-lg shadow-md hover:bg-[#0c5599] active:scale-95">Ubah Password</button>
              </div>
            </div>
          </div>

        {:else if activeTab === "website"}
          <div class="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
            <div class="px-5 py-4 border-b border-gray-100 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 class="text-lg font-bold text-gray-800">Pengaturan Tampilan Website</h3>
                <p class="text-sm text-gray-500">Kelola aset gambar dan deskripsi website utama</p>
              </div>
              
              <!-- Sub Tabs inside Website Settings -->
              <div class="flex bg-gray-100 p-1 rounded-lg self-start sm:self-center">
                <button 
                  on:click={() => subTab = "hero"} 
                  class="px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer {subTab === 'hero' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
                >
                  Hero Banner
                </button>
                <button 
                  on:click={() => subTab = "about"} 
                  class="px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer {subTab === 'about' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
                >
                  About Us
                </button>
                <button 
                  on:click={() => subTab = "gallery"} 
                  class="px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer {subTab === 'gallery' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
                >
                  Gallery Slider
                </button>
              </div>
            </div>
            
            <div class="p-5 sm:p-6">
              
              {#if subTab === "hero"}
                <!-- HERO SECTION -->
                <div class="space-y-6">
                  <!-- Current Image Preview -->
                  <div class="space-y-2">
                    <span class="block text-sm font-semibold text-gray-700">Gambar Hero Dashboard Saat Ini</span>
                    <div class="relative max-w-xl aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner flex items-center justify-center">
                      {#if filePreview}
                        <img src={filePreview} alt="Pratinjau Baru" class="w-full h-full object-cover" />
                        <span class="absolute top-3 left-3 bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-md">Pratinjau Gambar Baru</span>
                      {:else if websiteSettings.heroImage}
                        <img src={`http://localhost:9999/assets/${websiteSettings.heroImage}`} alt="Hero Saat Ini" class="w-full h-full object-cover" />
                      {:else}
                        <img src="src/assets/bglogin.jpg" alt="Default Hero" class="w-full h-full object-cover" />
                        <span class="absolute top-3 left-3 bg-gray-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-md">Default Sistem</span>
                      {/if}
                    </div>
                  </div>

                  <!-- Upload Field -->
                  <div class="space-y-2">
                    <label class="block text-sm font-semibold text-gray-700">Unggah Gambar Hero Baru</label>
                    <div class="flex items-center justify-center w-full max-w-xl">
                      <label class="flex flex-col items-center justify-center w-full h-36 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div class="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                          <svg class="w-8 h-8 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {#if selectedFile}
                            <p class="text-sm font-bold text-blue-600 truncate max-w-xs">{selectedFile.name}</p>
                            <p class="text-xs text-gray-500 mt-1">Klik untuk mengganti file</p>
                          {:else}
                            <p class="text-sm text-gray-500 font-semibold">Klik untuk memilih gambar</p>
                            <p class="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (Max 2MB)</p>
                          {/if}
                        </div>
                        <input type="file" accept="image/*" class="hidden" on:change={handleFileChange} />
                      </label>
                    </div>
                  </div>

                  <!-- Action buttons -->
                  <div class="flex justify-between items-center pt-4 max-w-xl border-t border-gray-100">
                    {#if selectedFile}
                      <button 
                        on:click={() => { selectedFile = null; filePreview = null; }} 
                        class="px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                    {:else}
                      <div></div>
                    {/if}
                    <button 
                      on:click={uploadHeroImage} 
                      disabled={!selectedFile || isUploading}
                      class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-[#0a4682] rounded-lg shadow-md hover:bg-[#0c5599] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      {#if isUploading}
                        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Mengunggah...
                      {:else}
                        Perbarui Gambar Hero
                      {/if}
                    </button>
                  </div>
                </div>

              {:else if subTab === "about"}
                <!-- ABOUT US SECTION -->
                <div class="space-y-6">
                  <!-- Text Editor -->
                  <div class="space-y-2 max-w-xl">
                    <label for="aboutText" class="block text-sm font-semibold text-gray-700">Teks Deskripsi About Us</label>
                    <textarea 
                      id="aboutText" 
                      bind:value={aboutTextValue} 
                      rows="4" 
                      class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y"
                      placeholder="Masukkan deskripsi mengenai organisasi/website ini..."
                    ></textarea>
                    <div class="flex justify-end pt-1">
                      <button 
                        on:click={saveAboutText} 
                        disabled={isSavingAboutText}
                        class="px-5 py-2 text-xs font-bold text-white transition-all bg-[#0a4682] rounded-lg hover:bg-[#0c5599] disabled:opacity-50 cursor-pointer"
                      >
                        Simpan Perubahan Teks
                      </button>
                    </div>
                  </div>

                  <!-- Image Preview -->
                  <div class="space-y-2 pt-4 border-t border-gray-100 max-w-xl">
                    <span class="block text-sm font-semibold text-gray-700">Gambar About Us Saat Ini</span>
                    <div class="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner flex items-center justify-center">
                      {#if aboutFilePreview}
                        <img src={aboutFilePreview} alt="Pratinjau Baru" class="w-full h-full object-cover" />
                        <span class="absolute top-3 left-3 bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-md">Pratinjau Baru</span>
                      {:else if websiteSettings.aboutImage}
                        <img src={`http://localhost:9999/assets/${websiteSettings.aboutImage}`} alt="About Us Saat Ini" class="w-full h-full object-cover" />
                      {:else}
                        <img src="src/assets/bglogin.jpg" alt="Default About Us" class="w-full h-full object-cover" />
                        <span class="absolute top-3 left-3 bg-gray-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-md">Default Sistem</span>
                      {/if}
                    </div>
                  </div>

                  <!-- Upload Field -->
                  <div class="space-y-2 max-w-xl">
                    <label class="block text-sm font-semibold text-gray-700">Unggah Gambar About Us Baru</label>
                    <div class="flex items-center justify-center w-full">
                      <label class="flex flex-col items-center justify-center w-full h-36 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div class="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                          <svg class="w-8 h-8 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {#if selectedAboutFile}
                            <p class="text-sm font-bold text-blue-600 truncate max-w-xs">{selectedAboutFile.name}</p>
                            <p class="text-xs text-gray-500 mt-1">Klik untuk mengganti file</p>
                          {:else}
                            <p class="text-sm text-gray-500 font-semibold">Klik untuk memilih gambar</p>
                            <p class="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (Max 2MB)</p>
                          {/if}
                        </div>
                        <input type="file" accept="image/*" class="hidden" on:change={handleAboutFileChange} />
                      </label>
                    </div>
                  </div>

                  <!-- Action buttons -->
                  <div class="flex justify-between items-center pt-4 max-w-xl border-t border-gray-100">
                    {#if selectedAboutFile}
                      <button 
                        on:click={() => { selectedAboutFile = null; aboutFilePreview = null; }} 
                        class="px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                    {:else}
                      <div></div>
                    {/if}
                    <button 
                      on:click={uploadAboutImage} 
                      disabled={!selectedAboutFile || isUploadingAbout}
                      class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-[#0a4682] rounded-lg shadow-md hover:bg-[#0c5599] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      {#if isUploadingAbout}
                        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Mengunggah...
                      {:else}
                        Perbarui Gambar About Us
                      {/if}
                    </button>
                  </div>
                </div>

              {:else if subTab === "gallery"}
                <!-- GALLERY SLIDER SECTION -->
                <div class="space-y-8">
                  <!-- Form Add New Item -->
                  <div class="p-5 border border-gray-200 rounded-xl bg-gray-50 space-y-4 max-w-xl">
                    <h4 class="text-sm font-bold text-gray-800">Tambah Foto Baru ke Galeri</h4>
                    
                    <div class="space-y-3">
                      <div>
                        <label for="galleryTitle" class="block mb-1 text-xs font-semibold text-gray-700">Judul Foto (Opsional)</label>
                        <input 
                          id="galleryTitle" 
                          type="text" 
                          bind:value={galleryTitle} 
                          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                          placeholder="Masukkan judul atau keterangan foto..." 
                        />
                      </div>
                      
                      <div class="space-y-1">
                        <span class="block text-xs font-semibold text-gray-700">File Foto</span>
                        <div class="flex items-center gap-4">
                          <label class="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 cursor-pointer flex items-center gap-1.5">
                            <svg class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Pilih Foto
                            <input type="file" accept="image/*" class="hidden" on:change={handleGalleryFileChange} />
                          </label>
                          {#if selectedGalleryFile}
                            <span class="text-xs font-bold text-blue-600 truncate max-w-[200px]">{selectedGalleryFile.name}</span>
                          {:else}
                            <span class="text-xs text-gray-400">Belum memilih foto</span>
                          {/if}
                        </div>
                      </div>

                      {#if galleryFilePreview}
                        <div class="relative w-32 aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 mt-2 bg-white">
                          <img src={galleryFilePreview} alt="Pratinjau Galeri" class="w-full h-full object-cover" />
                        </div>
                      {/if}
                    </div>

                    <div class="flex justify-end pt-2">
                      <button 
                        on:click={uploadGalleryItem}
                        disabled={!selectedGalleryFile || isUploadingGallery}
                        class="px-5 py-2 text-xs font-bold text-white bg-[#0a4682] hover:bg-[#0c5599] rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                      >
                        {#if isUploadingGallery}
                          <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Menambahkan...
                        {:else}
                          Tambah ke Galeri
                        {/if}
                      </button>
                    </div>
                  </div>

                  <!-- Gallery List / Grid -->
                  <div class="space-y-4">
                    <h4 class="text-sm font-bold text-gray-800">Daftar Foto Galeri Saat Ini</h4>
                    
                    {#if websiteSettings.gallery && websiteSettings.gallery.length > 0}
                      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {#each websiteSettings.gallery as item}
                          <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col group relative">
                            <!-- Image container -->
                            <div class="aspect-[4/3] bg-gray-50 border-b border-gray-100 overflow-hidden relative">
                              <img src={`http://localhost:9999/assets/${item.image}`} alt={item.title} class="w-full h-full object-cover" />
                              
                              <!-- Floating Delete Button -->
                              <button 
                                on:click={() => deleteGalleryItem(item.id)}
                                disabled={isDeletingGalleryId === item.id}
                                class="absolute top-2 right-2 p-1.5 bg-white hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg shadow-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer disabled:opacity-50"
                                title="Hapus foto"
                              >
                                <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            <!-- Title info -->
                            <div class="p-3.5 flex justify-between items-center">
                              <span class="text-xs font-bold text-gray-700 truncate pr-2">{item.title}</span>
                              <button 
                                on:click={() => deleteGalleryItem(item.id)}
                                disabled={isDeletingGalleryId === item.id}
                                class="text-red-500 hover:text-red-700 transition-colors sm:hidden"
                              >
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <div class="p-8 border border-gray-200 border-dashed rounded-xl flex flex-col items-center justify-center text-center bg-gray-50 max-w-xl">
                        <svg class="w-10 h-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p class="text-xs font-semibold text-gray-500">Belum ada foto galeri yang diunggah</p>
                        <p class="text-[10px] text-gray-400 mt-0.5">Slider di dashboard utama akan menampilkan gambar default sistem</p>
                      </div>
                    {/if}
                  </div>
                </div>

              {/if}

            </div>
          </div>

        {/if}

      </div>
    </main>
  </div>
</div>
