<script>
  import { push } from "svelte-spa-router";
  import { onMount } from "svelte";
  import Swal from "sweetalert2";
  import {fetchWithAuth} from "$lib/auth.js"

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

  let profile = { nama: "", email: "", username: "",role: "User", team: "", game_id: "", server_id: "" };
  let password = { current: "", new: "", confirm: "" };
  
  let initialProfile = { nama: "", email: "", username: "", game_id: "", server_id: "" };

  $: isProfileUnchanged = 
    profile.nama === initialProfile.nama &&
    profile.username === initialProfile.username &&
    profile.email === initialProfile.email &&
    profile.game_id === initialProfile.game_id &&
    profile.server_id === initialProfile.server_id;
  
  // State untuk modal OTP
  let isOtpModalOpen = false;
  let otpCodes = ['', '', '', ''];
  let otpInputs = [];
  let pendingProfileData = null;
  let pendingPasswordData = null;
  let otpAction = null;
  let isLoadingOtp = false;
  let countdown = 0;
  let countdownInterval = null;
  let isSendingOtp = false;
  let otpTimestamp = null;

  function saveOtpState() {
    if (isOtpModalOpen) {
      sessionStorage.setItem("otp_modal_state", JSON.stringify({
        pendingProfileData,
        pendingPasswordData,
        otpAction,
        otpCodes,
        countdown,
        otpTimestamp: otpTimestamp || Date.now()
      }));
    } else {
      sessionStorage.removeItem("otp_modal_state");
    }
  }

  // Helper function untuk cek apakah user punya tim
  function hasTeam() {
    const tim = localStorage.getItem("tim");
    return tim && tim !== "null" && tim !== "undefined" && tim.trim() !== "";
  }

  // Helper function untuk mendapatkan nama tim
  function getTeamName() {
    const tim = localStorage.getItem("tim");
    if (!tim || tim === "null" || tim === "undefined" || tim.trim() === "") {
      return "Tidak Ada Tim";
    }
    return tim;
  }

  // Ambil PFP dari localStorage dan tampilkan melalui proxy
  function getPfp() {
    const pfp = localStorage.getItem("user_avatar");
    if (pfp && pfp !== "null" && pfp !== "undefined") {
      const timestamp = Date.now();
      return `/avatar/${pfp}?t=${timestamp}`;
    }
    return "";
  }

  // Refresh PFP
  function refreshPfp() {
    const pfp = localStorage.getItem("user_avatar");
    if (pfp && pfp !== "null" && pfp !== "undefined") {
      const timestamp = Date.now();
      userPfp = `/avatar/${pfp}?t=${timestamp}`;
      // Force re-render
      userPfp = userPfp;
    } else {
      userPfp = "";
    }
  }

  onMount(() => {
    const name = localStorage.getItem("user_name");
    if (name) {
      currentUserName = name;
      profile.nama = name;
      profile.username = localStorage.getItem("username") || "";
      profile.email = localStorage.getItem("email") || "";
      profile.game_id = localStorage.getItem("user_game_id") || "";
      profile.server_id = localStorage.getItem("user_server_id") || "";
      profile.team = getTeamName();
      
      // Ambil PFP dari localStorage
      userPfp = getPfp();
      
      // Simpan data profil awal
      initialProfile = {
        nama: profile.nama,
        username: profile.username,
        email: profile.email,
        game_id: profile.game_id,
        server_id: profile.server_id
      };
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
    if(userStatus === "false"){
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

    // Restore OTP state if exists
    const savedOtpStateStr = sessionStorage.getItem("otp_modal_state");
    if (savedOtpStateStr) {
      try {
        const savedState = JSON.parse(savedOtpStateStr);
        if (savedState) {
          pendingProfileData = savedState.pendingProfileData;
          pendingPasswordData = savedState.pendingPasswordData;
          otpAction = savedState.otpAction;
          otpCodes = savedState.otpCodes || ['', '', '', ''];
          otpTimestamp = savedState.otpTimestamp;
          
          if (otpAction === 'profile' && pendingProfileData) {
            profile.nama = pendingProfileData.nama;
            profile.username = pendingProfileData.username;
            profile.email = pendingProfileData.email;
            profile.game_id = pendingProfileData.game_id;
            profile.server_id = pendingProfileData.server_id;
          } else if (otpAction === 'password' && pendingPasswordData) {
            password.current = pendingPasswordData.current;
            password.new = pendingPasswordData.new;
            password.confirm = pendingPasswordData.new;
          }
          
          const elapsedSeconds = Math.floor((Date.now() - otpTimestamp) / 1000);
          const remainingCountdown = 60 - elapsedSeconds;
          
          isOtpModalOpen = true;
          
          if (remainingCountdown > 0) {
            startCountdown(remainingCountdown);
          } else {
            countdown = 0;
          }
          
          setTimeout(() => {
            if (otpInputs[0]) otpInputs[0].focus();
          }, 100);
        }
      } catch (e) {
        console.error("Error restoring OTP state:", e);
        sessionStorage.removeItem("otp_modal_state");
      }
    }

    // Refresh PFP saat tab aktif kembali
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshPfp();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  });
  
  function startCountdown(seconds = 60) {
    countdown = seconds;
    saveOtpState();
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      if (countdown > 0) {
        countdown--;
        saveOtpState();
      } else {
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  async function sendOtpEmail() {
    isSendingOtp = true;
    try {
      const response = await fetchWithAuth("/api/users/request/otp", {
        method: "POST",
        credentials: 'include'
      });
      const data = await response.json();
      
      Swal.close();
      
      otpTimestamp = Date.now();
      startCountdown(60);
      saveOtpState();
      return true;
    } catch (error) {
      console.error("Error sending OTP:", error);
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Gagal Kirim OTP',
        text: 'Terjadi kesalahan, silakan coba lagi',
        confirmButtonColor: '#ef4444'
      });
      return false;
    } finally {
      isSendingOtp = false;
    }
  }

  // Verifikasi OTP
  async function verifyOtp(otpCode) {
    try {
      const response = await fetchWithAuth("/api/users/verify", {
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

  // Update profile ke server - FIXED
  async function updateProfileToServer(updatedData) {
    try {
      // Siapkan data yang akan dikirim
      const dataToSend = {};
      
      // Cek perubahan menggunakan updatedData yang dikirim
      if (updatedData.nama && updatedData.nama !== initialProfile.nama) {
        dataToSend.nama = updatedData.nama;
      }
      if (updatedData.username && updatedData.username !== initialProfile.username) {
        dataToSend.username = updatedData.username;
      }
      if (updatedData.email && updatedData.email !== initialProfile.email) {
        dataToSend.email = updatedData.email;
      }
      if (updatedData.game_id && updatedData.game_id !== initialProfile.game_id) {
        dataToSend.game_id = updatedData.game_id;
      }
      if (updatedData.server_id && updatedData.server_id !== initialProfile.server_id) {
        dataToSend.server_id = updatedData.server_id;
      }
      
      // Jika tidak ada perubahan, return true
      if (Object.keys(dataToSend).length === 0) {
        Swal.fire({
          icon: "info",
          title: "Tidak Ada Perubahan",
          text: "Tidak ada data yang diubah untuk disimpan.",
          confirmButtonColor: "#0a4682"
        });
        return true;
      }
      
      const response = await fetchWithAuth("/api/users/updateprofile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
        credentials: 'include'
      });

      if (response.status === 200) {
        // Update localStorage dan initialProfile untuk semua field yang berubah
        if (dataToSend.nama) {
          localStorage.setItem("user_name", dataToSend.nama);
          initialProfile.nama = dataToSend.nama;
          currentUserName = dataToSend.nama;
          profile.nama = dataToSend.nama;
        }
        if (dataToSend.username) {
          localStorage.setItem("username", dataToSend.username);
          initialProfile.username = dataToSend.username;
          profile.username = dataToSend.username;
        }
        if (dataToSend.email) {
          localStorage.setItem("email", dataToSend.email);
          initialProfile.email = dataToSend.email;
          profile.email = dataToSend.email;
        }
        if (dataToSend.game_id) {
          localStorage.setItem("user_game_id", dataToSend.game_id);
          initialProfile.game_id = dataToSend.game_id;
          profile.game_id = dataToSend.game_id;
        }
        if (dataToSend.server_id) {
          localStorage.setItem("user_server_id", dataToSend.server_id);
          initialProfile.server_id = dataToSend.server_id;
          profile.server_id = dataToSend.server_id;
        }
        
        return true;
      } else {
        const data = await response.json();
        const errorMessage = data.errors || data.message || 'Gagal memperbarui profil';
        Swal.fire({
          icon: 'error',
          title: 'Gagal Update Profil',
          text: errorMessage,
          confirmButtonColor: '#ef4444'
        });
        return false;
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan pada server. Silakan coba lagi.',
        confirmButtonColor: '#ef4444'
      });
      return false;
    }
  }

  // Update password ke server
  async function updatePasswordToServer(passwordData) {
    try {
      const response = await fetchWithAuth("/api/users/update/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: passwordData.current,
          password_new: passwordData.new
        }),
        credentials: 'include'
      });

      if (response.status === 200) {
        return true;
      } else {
        const data = await response.json();
        const errorMessage = data.errors || data.message || 'Password saat ini salah!';
        Swal.fire({
          icon: 'error',
          title: 'Gagal Update Password',
          text: errorMessage,
          confirmButtonColor: '#ef4444'
        });
        return false;
      }
    } catch (error) {
      console.error("Error updating password:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan pada server. Silakan coba lagi.',
        confirmButtonColor: '#ef4444'
      });
      return false;
    }
  }

  
  function handleOtpInput(index, event) {
    const value = event.target.value;
    if (!/^\d*$/.test(value)) {
      otpCodes[index] = '';
      otpCodes = otpCodes;
      saveOtpState();
      return;
    }
    otpCodes[index] = value.slice(-1);
    otpCodes = otpCodes;
    saveOtpState();
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
    otpCodes = otpCodes;
    saveOtpState();
  }

  function handleOtpPaste(event) {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    for (let i = 0; i < 4; i++) {
      otpCodes[i] = pasted[i] || '';
    }
    otpCodes = otpCodes;
    saveOtpState();
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
    otpTimestamp = null;
    sessionStorage.removeItem("otp_modal_state");
  }
  
  async function saveProfile() {
    if (isSendingOtp) return;
    
    // Cek perubahan pada SEMUA field
    const hasNamaChange = profile.nama.trim() !== initialProfile.nama && profile.nama.trim() !== "";
    const hasUsernameChange = profile.username.trim() !== initialProfile.username && profile.username.trim() !== "";
    const hasEmailChange = profile.email.trim() !== initialProfile.email && profile.email.trim() !== "";
    const hasGameIdChange = profile.game_id.trim() !== initialProfile.game_id && profile.game_id.trim() !== "";
    const hasServerIdChange = profile.server_id.trim() !== initialProfile.server_id && profile.server_id.trim() !== "";
    
    // Jika tidak ada perubahan sama sekali
    if (!hasNamaChange && !hasUsernameChange && !hasEmailChange && !hasGameIdChange && !hasServerIdChange) {
      Swal.fire({
        icon: "info",
        title: "Tidak Ada Perubahan",
        text: "Tidak ada data yang diubah untuk disimpan.",
        confirmButtonColor: "#0a4682"
      });
      return;
    }
    
    // Validasi field yang diubah
    if (hasNamaChange && !profile.nama.trim()) {
      Swal.fire({ icon: "warning", title: "Nama tidak boleh kosong!", confirmButtonColor: "#0a4682" });
      return;
    }
    if (hasUsernameChange && !profile.username.trim()) {
      Swal.fire({ icon: "warning", title: "Username tidak boleh kosong!", confirmButtonColor: "#0a4682" });
      return;
    }
    if (hasEmailChange && !profile.email.trim()) {
      Swal.fire({ icon: "warning", title: "Email tidak boleh kosong!", confirmButtonColor: "#0a4682" });
      return;
    }
    if (hasGameIdChange && !profile.game_id.trim()) {
      Swal.fire({ icon: "warning", title: "Game ID tidak boleh kosong!", confirmButtonColor: "#0a4682" });
      return;
    }
    if (hasServerIdChange && !profile.server_id.trim()) {
      Swal.fire({ icon: "warning", title: "Server ID tidak boleh kosong!", confirmButtonColor: "#0a4682" });
      return;
    }

    pendingProfileData = {
      nama: profile.nama,
      username: profile.username,
      email: profile.email,
      game_id: profile.game_id,
      server_id: profile.server_id
    };
    otpAction = 'profile';

    const otpSent = await sendOtpEmail();
    if (otpSent) {
      otpCodes = ['', '', '', ''];
      isOtpModalOpen = true;
      saveOtpState();
      
      setTimeout(() => {
        if (otpInputs[0]) otpInputs[0].focus();
      }, 100);
    }
  }
  
  async function savePassword() {
    if (isSendingOtp) return;
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

    isSendingOtp = true;
    try {
      const checkResponse = await fetchWithAuth("/api/users/check-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.current }),
        credentials: 'include'
      });
      
      if (checkResponse.status !== 200) {
        const checkData = await checkResponse.json();
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: checkData.errors || checkData.message || 'Password saat ini yang Anda masukkan salah!',
          confirmButtonColor: '#ef4444'
        });
        isSendingOtp = false;
        return;
      }
    } catch (err) {
      console.error("Error checking password:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal memverifikasi password. Silakan coba lagi.',
        confirmButtonColor: '#ef4444'
      });
      isSendingOtp = false;
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
      saveOtpState();
      
      setTimeout(() => {
        if (otpInputs[0]) otpInputs[0].focus();
      }, 100);
    }
  }
  
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
        isLoadingOtp = false;
        return;
      }

      let updateSuccess = false;

      if (otpAction === 'profile') {
        updateSuccess = await updateProfileToServer(pendingProfileData);
        if (updateSuccess) {
          if (pendingProfileData.nama) {
            currentUserName = pendingProfileData.nama;
          }
        }
      } else if (otpAction === 'password') {
        updateSuccess = await updatePasswordToServer(pendingPasswordData);
        if (updateSuccess) {
          password = { current: "", new: "", confirm: "" };
        }
      }
      
      if (updateSuccess) {
        resetOtpModal();
        localStorage.clear();
        sessionStorage.clear();
        
        Swal.fire({
          icon: "success", 
          title: otpAction === 'profile' ? "Profil berhasil diperbarui!" : "Password berhasil diubah!", 
          text: "Data Anda telah diperbarui. Silakan login kembali dengan data baru Anda.",
          confirmButtonColor: "#0a4682",
          confirmButtonText: "Login Kembali"
        }).then(() => {
          push('/signin');
        });
      }
      
    } catch (error) {
      console.error("Error:", error);
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
  
  function handleLogout() {
    Swal.fire({
      title: "Yakin ingin keluar?", icon: "warning", showCancelButton: true,
      confirmButtonColor: "#ef4444", cancelButtonColor: "#9ca3af", confirmButtonText: "Ya, Logout!",
    }).then((r) => { if (r.isConfirmed) {
      localStorage.clear();
      push("/")

    } });
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

  // Profile Picture variables & handlers
  let userPfp = "";
  let isCropModalOpen = false;
  let imageSrc = "";
  let scale = 1;
  let posX = 0;
  let posY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let canvasEl;
  let isUploadingPfp = false;

  function triggerFileInput() {
    const input = document.getElementById("pfp-input");
    if (input) input.click();
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      // Validasi tipe file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: 'warning',
          title: 'Format Tidak Didukung',
          text: 'Silakan upload file JPG, PNG, GIF, atau WebP',
          confirmButtonColor: '#0b5ba2'
        });
        e.target.value = '';
        return;
      }
      
      // Validasi ukuran file (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          icon: 'warning',
          title: 'Ukuran Terlalu Besar',
          text: 'Maksimal ukuran file adalah 2MB',
          confirmButtonColor: '#0b5ba2'
        });
        e.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        imageSrc = event.target.result;
        isCropModalOpen = true;
        scale = 1;
        posX = 0;
        posY = 0;
        setTimeout(drawCanvas, 100);
      };
      reader.readAsDataURL(file);
    }
  }

  function drawCanvas() {
    if (!canvasEl || !imageSrc) return;
    const ctx = canvasEl.getContext("2d");
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
      
      const baseSize = Math.min(img.width, img.height);
      const initScale = 200 / baseSize;
      const drawWidth = img.width * initScale * scale;
      const drawHeight = img.height * initScale * scale;
      
      const x = (150 - drawWidth / 2) + posX;
      const y = (150 - drawHeight / 2) + posY;

      // Blur background effect
      ctx.save();
      ctx.filter = "blur(8px) brightness(0.65)";
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      ctx.restore();

      // Sharp image inside circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(150, 150, 100, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#fafafa";
      ctx.fillRect(50, 50, 200, 200);
      ctx.filter = "none";
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      ctx.restore();

      // Circle outline
      ctx.beginPath();
      ctx.arc(150, 150, 100, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();
    };
  }

  function handleMouseDown(e) {
    if (!isCropModalOpen) return;
    isDragging = true;
    startX = e.clientX - posX;
    startY = e.clientY - posY;
  }

  function handleMouseMove(e) {
    if (!isDragging) return;
    posX = e.clientX - startX;
    posY = e.clientY - startY;
    drawCanvas();
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function handleTouchStart(e) {
    if (!isCropModalOpen || e.touches.length === 0) return;
    isDragging = true;
    startX = e.touches[0].clientX - posX;
    startY = e.touches[0].clientY - posY;
  }

  function handleTouchMove(e) {
    if (!isDragging || e.touches.length === 0) return;
    e.preventDefault();
    posX = e.touches[0].clientX - startX;
    posY = e.touches[0].clientY - startY;
    drawCanvas();
  }

  function handleTouchEnd() {
    isDragging = false;
  }

  function handleZoom(e) {
    scale = Number(e.target.value);
    drawCanvas();
  }

  async function uploadPfp() {
    if (!canvasEl || !imageSrc) return;
    
    isUploadingPfp = true;
    
    try {
      // Create temporary canvas for cropping
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = 200;
      outputCanvas.height = 200;
      const oCtx = outputCanvas.getContext("2d");
      oCtx.fillStyle = "#ffffff";
      oCtx.fillRect(0, 0, 200, 200);

      const img = new Image();
      img.src = imageSrc;
      
      await new Promise((resolve) => {
        img.onload = () => {
          oCtx.save();
          oCtx.beginPath();
          oCtx.arc(100, 100, 100, 0, Math.PI * 2);
          oCtx.clip();

          const baseSize = Math.min(img.width, img.height);
          const initScale = 200 / baseSize;
          const drawWidth = img.width * initScale * scale;
          const drawHeight = img.height * initScale * scale;
          const x = (100 - drawWidth / 2) + posX;
          const y = (100 - drawHeight / 2) + posY;

          oCtx.drawImage(img, x, y, drawWidth, drawHeight);
          oCtx.restore();
          resolve();
        };
      });

      // Convert to blob
      const blob = await new Promise(resolve => outputCanvas.toBlob(resolve, 'image/jpeg', 0.9));
      
      // Create FormData
      const formData = new FormData();
      formData.append('avatar', blob, 'pfp.jpg');

      // Show loading
      Swal.fire({
        title: 'Mengupload foto...',
        text: 'Mohon tunggu sebentar',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await fetch("/api/users/upload/pfp", {
        method: "PATCH",
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();

      Swal.close();

      if (response.status === 200) {
        // Save pfp filename from response
        const pfpFilename = result.data?.pfp
        
        if (pfpFilename) {
          // Simpan nama file ke localStorage
          localStorage.setItem("user_avatar", pfpFilename);
          // Tampilkan melalui proxy dengan timestamp untuk force refresh
          const timestamp = Date.now();
          userPfp = `/avatar/${pfpFilename}?t=${timestamp}`;
          // Force re-render
          userPfp = userPfp;
        }
        
        isCropModalOpen = false;

        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Foto profil Anda berhasil diganti.",
          confirmButtonColor: "#0a2e52",
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: result.message || "Gagal mengupload foto profil.",
          confirmButtonColor: "#ef4444"
        });
      }
    } catch (error) {
      console.error("Error uploading pfp:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Terjadi kesalahan saat mengupload foto.",
        confirmButtonColor: "#ef4444"
      });
    } finally {
      isUploadingPfp = false;
    }
  }
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
        <span class="text-xl md:text-2xl font-bold tracking-wider">smegione</span>
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
          {#if userPfp}
            <img src={userPfp} alt="Profile" class="w-11 h-11 rounded-full object-cover border border-gray-200 shadow-sm" />
          {:else}
            <div class="w-11 h-11 rounded-full bg-gray-400 flex items-center justify-center">
              <span class="text-lg font-bold text-black">{currentUserName.charAt(0).toUpperCase()}</span>
            </div>
          {/if}
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
        <div class="relative p-6 overflow-hidden text-white shadow-lg sm:p-8 bg-gradient-to-r 
          {hasTeam() ? 'from-[#0a4682] to-[#126bc2]' : 'from-red-700 to-rose-600'} 
          rounded-2xl"
        >
          <div class="relative z-10 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            
            <div class="relative group cursor-pointer shrink-0" on:click={triggerFileInput} title="Tekan untuk mengubah foto profil">
              {#if userPfp}
                <img src={userPfp} alt="Profile" class="w-20 h-20 rounded-full border-2 border-white/40 object-cover shadow-md" />
              {:else}
                <div class="flex items-center justify-center w-20 h-20 text-3xl font-black rounded-full bg-white/20 border-2 border-white/40">
                  {currentUserName.charAt(0).toUpperCase()}
                </div>
              {/if}
              <!-- Hover Overlay trigger -->
              <div class="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            
            <div class="text-center sm:text-left">
              <h3 class="text-xl font-bold sm:text-2xl">{currentUserName}</h3>
              
              <p class="text-sm {hasTeam() ? 'text-blue-200' : 'text-red-100'}">
                {profile.role} • {getTeamName()}
              </p>
              
              <p class="mt-1 text-xs {hasTeam() ? 'text-blue-300' : 'text-red-200'}">
                {profile.email}
              </p>
            </div>
            
          </div>
          
          <div class="absolute w-64 h-64 bg-white rounded-full opacity-5 -right-10 -top-20 blur-2xl pointer-events-none"></div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 p-1 bg-white border border-gray-200 shadow-sm rounded-xl">
          {#each tabs as tab}
            <button
              on:click={() => activeTab = tab.id}
              class="flex items-center justify-center flex-1 gap-2 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all 
                {activeTab === tab.id 
                  ? (hasTeam() ? 'bg-[#0a4682] text-white shadow-md' : 'bg-red-700 text-white shadow-md') 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d={tab.icon} />
              </svg>
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
                  <input id="nama" type="text" bind:value={profile.nama} 
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg outline-none transition-all {hasTeam() ? 'focus:ring-2 focus:ring-[#0a4682] focus:border-[#0a4682]' : 'focus:ring-2 focus:ring-red-500 focus:border-red-500'}" />
                </div>
                <div>
                  <label for="username" class="block mb-1.5 text-sm font-semibold text-gray-700">Username</label>
                  <input id="username" type="text" bind:value={profile.username} 
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg outline-none transition-all {hasTeam() ? 'focus:ring-2 focus:ring-[#0a4682] focus:border-[#0a4682]' : 'focus:ring-2 focus:ring-red-500 focus:border-red-500'}" />
                </div>
                <div>
                  <label for="role" class="block mb-1.5 text-sm font-semibold text-gray-700">Role</label>
                  <input id="role" type="text" value={profile.role} disabled 
                    class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                </div>
              </div>
              
              <div>
                <label for="email" class="block mb-1.5 text-sm font-semibold text-gray-700">Email</label>
                <input id="email" type="email" bind:value={profile.email} 
                  class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg outline-none transition-all {hasTeam() ? 'focus:ring-2 focus:ring-[#0a4682] focus:border-[#0a4682]' : 'focus:ring-2 focus:ring-red-500 focus:border-red-500'}" />
              </div>
              
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label for="game_id" class="block mb-1.5 text-sm font-semibold text-gray-700">Game ID</label>
                  <input id="game_id" type="text" bind:value={profile.game_id} 
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg outline-none transition-all {hasTeam() ? 'focus:ring-2 focus:ring-[#0a4682] focus:border-[#0a4682]' : 'focus:ring-2 focus:ring-red-500 focus:border-red-500'}" />
                </div>
                <div>
                  <label for="server_id" class="block mb-1.5 text-sm font-semibold text-gray-700">Server ID</label>
                  <input id="server_id" type="text" bind:value={profile.server_id} 
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg outline-none transition-all {hasTeam() ? 'focus:ring-2 focus:ring-[#0a4682] focus:border-[#0a4682]' : 'focus:ring-2 focus:ring-red-500 focus:border-red-500'}" />
                </div>
              </div>
              
              <div class="flex justify-end pt-2">
                <button on:click={saveProfile} 
                  disabled={isSendingOtp || isProfileUnchanged}
                  class="px-6 py-2.5 text-sm font-bold text-white transition-all rounded-lg shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 {hasTeam() ? 'bg-[#0a4682] hover:bg-[#0c5599]' : 'bg-red-700 hover:bg-red-800'}"
                >
                  {#if isSendingOtp}
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Menghubungkan...
                  {:else}
                    Simpan Profil
                  {/if}
                </button>
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
                <input id="currentPw" type="password" bind:value={password.current} placeholder="Masukkan password saat ini"
                  class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg outline-none transition-all {hasTeam() ? 'focus:ring-2 focus:ring-[#0a4682] focus:border-[#0a4682]' : 'focus:ring-2 focus:ring-red-500 focus:border-red-500'}" />
              </div>
              
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label for="newPw" class="block mb-1.5 text-sm font-semibold text-gray-700">Password Baru</label>
                  <input id="newPw" type="password" bind:value={password.new} placeholder="Masukkan password baru"
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg outline-none transition-all {hasTeam() ? 'focus:ring-2 focus:ring-[#0a4682] focus:border-[#0a4682]' : 'focus:ring-2 focus:ring-red-500 focus:border-red-500'}" />
                </div>
                <div>
                  <label for="confirmPw" class="block mb-1.5 text-sm font-semibold text-gray-700">Konfirmasi Password</label>
                  <input id="confirmPw" type="password" bind:value={password.confirm} placeholder="Ulangi password baru"
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg outline-none transition-all {hasTeam() ? 'focus:ring-2 focus:ring-[#0a4682] focus:border-[#0a4682]' : 'focus:ring-2 focus:ring-red-500 focus:border-red-500'}" />
                </div>
              </div>
              
              <div class="flex justify-end pt-2">
                <button on:click={savePassword} 
                  disabled={isSendingOtp}
                  class="px-6 py-2.5 text-sm font-bold text-white transition-all rounded-lg shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 {hasTeam() ? 'bg-[#0a4682] hover:bg-[#0c5599]' : 'bg-red-700 hover:bg-red-800'}"
                >
                  {#if isSendingOtp}
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Menghubungkan...
                  {:else}
                    Ubah Password
                  {/if}
                </button>
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

<!-- Hidden PFP file input -->
<input type="file" id="pfp-input" accept="image/*" class="hidden" on:change={handleFileSelect} />

<!-- Modal Cropper (Framing Bulat) -->
{#if isCropModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
    <div class="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
      <!-- Header -->
      <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 class="font-extrabold text-gray-800 text-lg">Sesuaikan Foto Profil</h3>
        <button on:click={() => isCropModalOpen = false} class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Canvas Area -->
      <div class="p-6 flex flex-col items-center justify-center bg-gray-50 border-b border-gray-100">
        <p class="text-xs text-gray-500 mb-4 text-center">Geser foto dengan mouse/jari</p>
        
        <div 
          class="relative w-[300px] h-[300px] bg-gray-100 rounded-xl overflow-hidden shadow-inner border border-gray-200 cursor-move select-none"
          on:mousedown={handleMouseDown}
          on:mousemove={handleMouseMove}
          on:mouseup={handleMouseUp}
          on:mouseleave={handleMouseUp}
          on:touchstart={handleTouchStart}
          on:touchmove={handleTouchMove}
          on:touchend={handleTouchEnd}
        >
          <canvas bind:this={canvasEl} width="300" height="300" class="absolute inset-0 w-full h-full pointer-events-none"></canvas>
        </div>

        <!-- Slider Zoom -->
        <div class="w-full mt-6 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-gray-600">
            <span>Perkecil</span>
            <span>Perbesar</span>
          </div>
          <input 
            type="range" 
            min="0.5" 
            max="3" 
            step="0.05" 
            value={scale} 
            on:input={handleZoom} 
            class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0a2e52]" 
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="px-5 py-4 bg-gray-50 flex items-center justify-end gap-3">
        <button 
          on:click={() => isCropModalOpen = false} 
          class="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Batal
        </button>
        <button 
          on:click={uploadPfp} 
          disabled={isUploadingPfp}
          class="px-5 py-2 text-sm font-bold text-white bg-[#0a2e52] hover:bg-[#0c5599] rounded-lg shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if isUploadingPfp}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Mengupload...
          {:else}
            Simpan Foto
          {/if}
        </button>
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