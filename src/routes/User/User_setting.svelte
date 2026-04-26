<script>
  import { push } from "svelte-spa-router";
  import { onMount } from "svelte";
  import Swal from "sweetalert2";

  if(localStorage.getItem("role") !== "user"){
    Swal.fire({
        icon: 'error',
        title: 'Unauthorized',
        text: 'Redirecting......',
        confirmButtonColor: '#0b5ba2'
      }).then(() => {
        push('/admin/beranda');
      });
  }

  let currentUserName = "Loading...";
  let activeTab = "profile";

  let profile = { nama: "", email: "", role: "User", game_id: "", server_id: "" };
  let password = { current: "", new: "", confirm: "" };
  
  // State untuk modal OTP
  let isOtpModalOpen = false;
  let otpCodes = ['', '', '', ''];
  let otpInputs = [];
  let pendingProfileData = null;
  let pendingPasswordData = null;
  let otpAction = null; // 'profile' atau 'password'
  let isLoadingOtp = false;
  let countdown = 0;
  let countdownInterval = null;

  onMount(() => {
    const name = localStorage.getItem("user_name");
    if (name) {
      currentUserName = name;
      profile.nama = name;
      profile.email = localStorage.getItem("email") || "";
      profile.game_id = localStorage.getItem("user_game_id") || "";
      profile.server_id = localStorage.getItem("user_server_id") || "";
    } else {
      push("/");
    }

    const userRole = localStorage.getItem("user_role");
    if(userRole !== "user"){
      Swal.fire({
        icon: 'error',
        title: 'Unauthorized',
        text: 'Redirecting......',
        confirmButtonColor: '#0b5ba2'
      }).then(() => {
        push('/admin/beranda');
      });
      return;
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
  });

  // ==================== FUNGSI OTP ====================
  
  function startCountdown(seconds = 60) {
    countdown = seconds;
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      if (countdown > 0) {
        countdown--;
      } else {
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  // Kirim OTP ke email
  async function sendOtpEmail() {
    try {
      const response = await fetch("http://localhost:9999/api/users/request/otp", {
        method: "POST",
        credentials: 'include'
      });
      const data = await response.json();
      
      Swal.fire({
        icon: 'success',
        title: 'Kode OTP Dikirim!',
        text: `Kode verifikasi telah dikirim ke ${profile.email}`,
        confirmButtonColor: '#0b5ba2',
        timer: 2000,
        showConfirmButton: false
      });
      
      startCountdown(60);
      return true;
    } catch (error) {
      console.error("Error sending OTP:", error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Kirim OTP',
        text: 'Terjadi kesalahan, silakan coba lagi',
        confirmButtonColor: '#ef4444'
      });
      return false;
    }
  }

  // Verifikasi OTP
  async function verifyOtp(otpCode) {
    try {
      const response = await fetch("http://localhost:9999/api/users/verify", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          otp: otpCode 
        })
      });

      const data = await response.json();

      if (response.status !== 200) {
        Swal.fire({
          icon: 'error',
          title: 'Verifikasi Gagal',
          text: data.message || 'Kode verifikasi yang kamu masukkan salah!',
          confirmButtonColor: '#ef4444'
        });
        return false;  
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Verifikasi Berhasil!',
          text: `Kode OTP valid!`,
          confirmButtonColor: '#3b82f6',
          timer: 1500,
          showConfirmButton: false
        });
        return true; 
      }
      
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return false; 
    }
  }

  // Update profile ke server
  async function updateProfileToServer(updatedData) {
    try {
      const response = await fetch("http://localhost:9999/api/users/updateprofile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
        credentials: 'include'
      });
  
      if (response.status === 200) {
        localStorage.setItem("user_name", updatedData.nama);
        localStorage.setItem("email", updatedData.email);
        localStorage.setItem("user_game_id", updatedData.game_id);
        localStorage.setItem("user_server_id", updatedData.server_id);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  }

  // Update password ke server
  async function updatePasswordToServer(passwordData) {
    try {
      const response = await fetch("http://localhost:9999/api/users/update/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: passwordData.current,
          password_new: passwordData.new
        }),
        credentials: 'include'
      });
  
      if (response.status === 200) {
        push('/signIn');
        return true;
      } else {
        const data = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Gagal Update Password',
          text: data.message || 'Password saat ini salah!',
          confirmButtonColor: '#ef4444'
        });
        return false;
      }
    } catch (error) {
      console.error("Error updating password:", error);
      return false;
    }
  }

  // ==================== FUNGSI OTP INPUT ====================
  
  function handleOtpInput(index, event) {
    const value = event.target.value;
    if (!/^\d*$/.test(value)) {
      otpCodes[index] = '';
      return;
    }
    otpCodes[index] = value.slice(-1);
    if (otpCodes[index] && index < 3) {
      otpInputs[index + 1].focus();
    }
  }

  function handleOtpKeydown(index, event) {
    if (event.key === 'Backspace') {
      if (!otpCodes[index] && index > 0) {
        otpCodes[index - 1] = '';
        otpInputs[index - 1].focus();
      } else {
        otpCodes[index] = '';
      }
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      otpInputs[index - 1].focus();
    }
    if (event.key === 'ArrowRight' && index < 3) {
      otpInputs[index + 1].focus();
    }
  }

  function handleOtpPaste(event) {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    for (let i = 0; i < 4; i++) {
      otpCodes[i] = pasted[i] || '';
    }
    const lastIndex = Math.min(pasted.length, 3);
    otpInputs[lastIndex]?.focus();
  }

  function resetOtpModal() {
    otpCodes = ['', '', '', ''];
    isOtpModalOpen = false;
    pendingProfileData = null;
    pendingPasswordData = null;
    otpAction = null;
    if (countdownInterval) clearInterval(countdownInterval);
    countdown = 0;
  }

  // ==================== SAVE PROFILE (dengan OTP) ====================
  
  async function saveProfile() {
    if (!profile.nama.trim()) {
      Swal.fire({ icon: "warning", title: "Nama tidak boleh kosong!", confirmButtonColor: "#0a4682" });
      return;
    }
    if (!profile.email.trim()) {
      Swal.fire({ icon: "warning", title: "Email tidak boleh kosong!", confirmButtonColor: "#0a4682" });
      return;
    }
    if (!profile.game_id.trim()) {
      Swal.fire({ icon: "warning", title: "Game ID tidak boleh kosong!", confirmButtonColor: "#0a4682" });
      return;
    }
    if (!profile.server_id.trim()) {
      Swal.fire({ icon: "warning", title: "Server ID tidak boleh kosong!", confirmButtonColor: "#0a4682" });
      return;
    }

    pendingProfileData = {
      nama: profile.nama,
      email: profile.email,
      game_id: profile.game_id,
      server_id: profile.server_id
    };
    otpAction = 'profile';

    const otpSent = await sendOtpEmail();
    if (otpSent) {
      otpCodes = ['', '', '', ''];
      isOtpModalOpen = true;
      
      setTimeout(() => {
        if (otpInputs[0]) otpInputs[0].focus();
      }, 100);
    }
  }

  // ==================== SAVE PASSWORD (dengan OTP) ====================
  
  async function savePassword() {
    if (!password.current || !password.new || !password.confirm) {
      Swal.fire({ icon: "warning", title: "Lengkapi semua field!", confirmButtonColor: "#0a4682" });
      return;
    }
    if (password.new !== password.confirm) {
      Swal.fire({ icon: "error", title: "Password baru tidak cocok!", confirmButtonColor: "#0a4682" });
      return;
    }
    if (password.new.length < 6) {
      Swal.fire({ icon: "error", title: "Password minimal 6 karakter!", confirmButtonColor: "#0a4682" });
      return;
    }

    pendingPasswordData = {
      current: password.current,
      new: password.new
    };
    otpAction = 'password';

    const otpSent = await sendOtpEmail();
    if (otpSent) {
      otpCodes = ['', '', '', ''];
      isOtpModalOpen = true;
      
      setTimeout(() => {
        if (otpInputs[0]) otpInputs[0].focus();
      }, 100);
    }
  }

  // ==================== HANDLE VERIFY OTP ====================
  
  async function handleVerifyOtp() {
    const otpCode = otpCodes.join('');
    
    if (otpCode.length !== 4) {
      Swal.fire({
        icon: 'warning',
        title: 'Kode Tidak Lengkap',
        text: 'Masukkan 4 digit kode verifikasi',
        confirmButtonColor: '#0b5ba2'
      });
      return;
    }

    isLoadingOtp = true;

    try {
      const isValid = await verifyOtp(otpCode);
      
      if (!isValid) {
        otpCodes = ['', '', '', ''];
        otpInputs[0]?.focus();
        return;
      }

      let updateSuccess = false;

      if (otpAction === 'profile') {
        updateSuccess = await updateProfileToServer(pendingProfileData);
        if (updateSuccess) {
          currentUserName = pendingProfileData.nama;
        }
      } else if (otpAction === 'password') {
        updateSuccess = await updatePasswordToServer(pendingPasswordData);
        if (updateSuccess) {
          password = { current: "", new: "", confirm: "" };
        }
      }
      
      if (updateSuccess) {
        Swal.fire({
          icon: "success", 
          title: otpAction === 'profile' ? "Profil berhasil diperbarui!" : "Password berhasil diubah!", 
          confirmButtonColor: "#0a4682",
          timer: 1500,
          showConfirmButton: false
        });
        
        resetOtpModal();
      } else {
        throw new Error(otpAction === 'profile' ? "Gagal update profil" : "Gagal update password");
      }
      
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error", 
        title: "Gagal!", 
        text: error.message || "Terjadi kesalahan saat memperbarui data", 
        confirmButtonColor: "#ef4444" 
      });
    } finally {
      isLoadingOtp = false;
    }
  }

  function resendOtp() {
    if (countdown > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Tunggu Sebentar',
        text: `Silakan tunggu ${countdown} detik sebelum meminta ulang OTP`,
        confirmButtonColor: '#0b5ba2'
      });
      return;
    }
    sendOtpEmail();
  }

  // ==================== LOGOUT & LAYOUT ====================
  
  function handleLogout() {
    Swal.fire({
      title: "Yakin ingin keluar?", icon: "warning", showCancelButton: true,
      confirmButtonColor: "#ef4444", cancelButtonColor: "#9ca3af", confirmButtonText: "Ya, Logout!",
    }).then((r) => { if (r.isConfirmed) { localStorage.removeItem("user_name"); localStorage.removeItem("user_role"); localStorage.removeItem("email"); localStorage.removeItem("user_game_id"); localStorage.removeItem("user_server_id"); push("/SignIn"); } });
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
      <div class="flex flex-col gap-1">
        <button on:click={() => { window.location.href = '#/user/absensi'; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          Dashboard
        </button>
        <button on:click={() => { window.location.href = "#/user/kegiatan"; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          Kegiatan
        </button>
        <button on:click={() => { window.location.href = "#/user/analisis"; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
          Analisis
        </button>
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

        <!-- Tab Content: Profile -->
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
              <div>
                <label for="email" class="block mb-1.5 text-sm font-semibold text-gray-700">Email</label>
                <input id="email" type="email" bind:value={profile.email} class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
              </div>
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label for="game_id" class="block mb-1.5 text-sm font-semibold text-gray-700">Game ID</label>
                  <input id="game_id" type="text" bind:value={profile.game_id} class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label for="server_id" class="block mb-1.5 text-sm font-semibold text-gray-700">Server ID</label>
                  <input id="server_id" type="text" bind:value={profile.server_id} class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>
              <div class="flex justify-end pt-2">
                <button on:click={saveProfile} class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-[#0a4682] rounded-lg shadow-md hover:bg-[#0c5599] active:scale-95">Simpan Profil</button>
              </div>
            </div>
          </div>

        <!-- Tab Content: Password -->
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
        {/if}

      </div>
    </main>
  </div>
</div>

<!-- MODAL OTP VERIFIKASI -->
{#if isOtpModalOpen}
<div class="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 w-screen h-screen animate-fade-in">
  <div class="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm" on:click={resetOtpModal} aria-hidden="true"></div>
  
  <div class="relative flex flex-col w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden">
    
    <div class="flex items-start justify-between p-6 border-b border-gray-100">
      <div>
        <h2 class="text-xl font-black text-gray-800">Verifikasi Kode OTP</h2>
        <p class="text-sm text-gray-500 mt-1">Kode verifikasi telah dikirim ke</p>
        <p class="text-sm font-semibold text-[#0a4682]">{profile.email}</p>
      </div>
      <button on:click={resetOtpModal} class="flex items-center justify-center w-8 h-8 text-white transition-colors bg-[#0a2e52] hover:bg-red-600 rounded-md shadow-sm">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>

    <div class="p-6 space-y-6">
      <!-- OTP Input -->
      <div class="flex justify-center gap-3">
        {#each otpCodes as code, i}
          <input
            bind:this={otpInputs[i]}
            type="text"
            inputmode="numeric"
            maxlength="1"
            value={code}
            on:input={(e) => handleOtpInput(i, e)}
            on:keydown={(e) => handleOtpKeydown(i, e)}
            on:paste={handleOtpPaste}
            disabled={isLoadingOtp}
            class="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl
                   focus:ring-2 focus:ring-[#0a4682] focus:border-[#0a4682] outline-none transition-all
                   bg-white text-gray-800 shadow-sm disabled:opacity-50"
            autocomplete="off"
          />
        {/each}
      </div>

      <!-- Resend OTP -->
      <div class="text-center">
        <p class="text-sm text-gray-500">
          Tidak menerima kode?
          <button 
            on:click={resendOtp} 
            disabled={countdown > 0}
            class="font-semibold text-[#0a4682] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if countdown > 0}
              Kirim ulang ({countdown}s)
            {:else}
              Kirim ulang kode
            {/if}
          </button>
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 pt-4">
        <button 
          on:click={resetOtpModal} 
          class="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Batal
        </button>
        <button 
          on:click={handleVerifyOtp} 
          disabled={isLoadingOtp}
          class="flex-1 px-4 py-2.5 text-sm font-bold text-white transition-colors bg-[#0a4682] rounded-lg hover:bg-[#0c5599] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if isLoadingOtp}
            <svg class="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          {:else}
            Verifikasi & Simpan
          {/if}
        </button>
      </div>
    </div>

  </div>
</div>
{/if}

<style>
  .animate-fade-in {
    animation: fadeIn 0.2s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>