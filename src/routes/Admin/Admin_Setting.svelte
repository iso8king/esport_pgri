<script>
  import { push } from "svelte-spa-router";
  import { onMount } from "svelte";
  import Swal from "sweetalert2";

  let currentUserName = "Loading...";
  let activeTab = "profile";

  let profile = { nama: "", email: "", phone: "", role: "Admin" };
  let password = { current: "", new: "", confirm: "" };
  let notif = { emailNotif: true, pushNotif: false, jadwalReminder: true, absenReminder: true };

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

  function saveNotif() {
    Swal.fire({ icon: "success", title: "Notifikasi berhasil disimpan!", confirmButtonColor: "#0a4682" });
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
    { id: "notif", label: "Notifikasi", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
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
        <button on:click={() => { window.location.href = '#/beranda'; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">Beranda</button>
      </div>
      <div>
        <p class="flex items-center gap-2 px-2 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
          Management
        </p>
        <div class="flex flex-col gap-1">
          <button on:click={() => { window.location.href = '#/anggota'; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">Anggota</button>
          <button on:click={() => { window.location.href = '#/absensi'; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">Absensi</button>
          <button on:click={() => { window.location.href = '#/analisis'; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">Analisis</button>
          <button on:click={() => { window.location.href = '#/jadwal'; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">Jadwal</button>
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

        {:else if activeTab === "notif"}
          <div class="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
            <div class="px-5 py-4 border-b border-gray-100 sm:px-6">
              <h3 class="text-lg font-bold text-gray-800">Preferensi Notifikasi</h3>
              <p class="text-sm text-gray-500">Atur notifikasi yang ingin Anda terima</p>
            </div>
            <div class="p-5 space-y-1 sm:p-6">
              {#each [
                { key: "emailNotif", label: "Email Notifikasi", desc: "Terima notifikasi melalui email" },
                { key: "pushNotif", label: "Push Notifikasi", desc: "Terima notifikasi push di browser" },
                { key: "jadwalReminder", label: "Pengingat Jadwal", desc: "Reminder sebelum jadwal dimulai" },
                { key: "absenReminder", label: "Pengingat Absensi", desc: "Reminder untuk mengisi absensi" }
              ] as item}
                <div class="flex items-center justify-between p-4 transition-colors rounded-xl hover:bg-gray-50">
                  <div>
                    <p class="text-sm font-semibold text-gray-800">{item.label}</p>
                    <p class="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <button
                    on:click={() => { notif[item.key] = !notif[item.key]; }}
                    class="relative w-11 h-6 rounded-full transition-colors duration-200 {notif[item.key] ? 'bg-[#0a4682]' : 'bg-gray-300'}"
                  >
                    <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 {notif[item.key] ? 'translate-x-5' : 'translate-x-0'}"></span>
                  </button>
                </div>
              {/each}
              <div class="flex justify-end pt-4">
                <button on:click={saveNotif} class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-[#0a4682] rounded-lg shadow-md hover:bg-[#0c5599] active:scale-95">Simpan Notifikasi</button>
              </div>
            </div>
          </div>
        {/if}

      </div>
    </main>
  </div>
</div>
