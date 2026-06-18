<script>
  import { push } from 'svelte-spa-router';
  import Swal from "sweetalert2";

  // Flow State: 1 = Email Form, 2 = OTP Form
  let currentStep = 1;

  // Form Fields
  let email = '';
  let codes = ['', '', '', ''];
  let inputs = [];
  
  // Reset Password Modal State
  let showModal = false;
  let newPassword = '';
  let confirmPassword = '';
  let showNewPassword = false;
  let showConfirmPassword = false;

  let isSubmitting = false;
  let countdown = 0;
  let countdownTimer;

  function startCountdown() {
    countdown = 60;
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      if (countdown > 0) {
        countdown--;
      } else {
        clearInterval(countdownTimer);
      }
    }, 1000);
  }

  async function handleSendOtp() {
    if (!email) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Kosong',
        text: 'Silakan masukkan email Anda terlebih dahulu!',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Tidak Valid',
        text: 'Silakan masukkan email yang valid!',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch("/api/otp/forget", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'OTP Terkirim!',
          html: `Kode OTP berhasil dikirim ke <b>${email}</b>.`,
          confirmButtonColor: '#3b82f6'
        }).then(() => {
          currentStep = 2;
          startCountdown();
          codes = ['', '', '', ''];
          setTimeout(() => {
            inputs[0]?.focus();
          }, 100);
        });
      } else {
        // Tampilkan error dari backend
        const errorMessage = data.errors || data.message || 'Gagal mengirim OTP';
        Swal.fire({
          icon: 'error',
          title: 'Gagal Kirim OTP',
          text: errorMessage,
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan pada server. Silakan coba lagi.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      isSubmitting = false;
    }
  }

  // Resend OTP
  function handleResendOtp() {
    if (countdown > 0) return;
    handleSendOtp();
  }

  // OTP inputs handling
  function handleInput(index, event) {
    const value = event.target.value;
    if (!/^\d*$/.test(value)) {
      codes[index] = '';
      return;
    }
    codes[index] = value.slice(-1);
    if (codes[index] && index < 3) {
      inputs[index + 1].focus();
    }
  }

  function handleKeydown(index, event) {
    if (event.key === 'Backspace') {
      if (!codes[index] && index > 0) {
        codes[index - 1] = '';
        inputs[index - 1].focus();
      } else {
        codes[index] = '';
      }
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputs[index - 1].focus();
    }
    if (event.key === 'ArrowRight' && index < 3) {
      inputs[index + 1].focus();
    }
  }

  function handlePaste(event) {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    for (let i = 0; i < 4; i++) {
      codes[i] = pasted[i] || '';
    }
    const lastIndex = Math.min(pasted.length, 3);
    inputs[lastIndex]?.focus();
  }

  // Verify OTP
  async function handleVerifyOtp() {
    const enteredCode = codes.join('');
    
    if (enteredCode.length < 4) {
      Swal.fire({
        icon: 'warning',
        title: 'Kode Belum Lengkap',
        text: 'Silakan masukkan 4 digit kode OTP!',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch("/api/otp/forget/verify", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email,
          otp: enteredCode 
        })
      });

      const data = await response.json();

      if (response.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Verifikasi Berhasil!',
          text: 'Kode OTP benar. Silakan ubah password Anda.',
          confirmButtonColor: '#3b82f6',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          showModal = true;
        });
      } else {
        const errorMessage = data.errors || data.message || 'Kode OTP yang Anda masukkan salah!';
        Swal.fire({
          icon: 'error',
          title: 'Verifikasi Gagal',
          text: errorMessage,
          confirmButtonColor: '#ef4444'
        });
        codes = ['', '', '', ''];
        inputs[0]?.focus();
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan pada server. Silakan coba lagi.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      isSubmitting = false;
    }
  }

  // Handle Reset Password Submit
  async function handleResetPassword() {
    if (!newPassword || !confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Tidak Lengkap',
        text: 'Pastikan password baru dan konfirmasi sudah diisi!',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    if (newPassword.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Password Terlalu Pendek',
        text: 'Password minimal harus 6 karakter!',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Password Tidak Cocok',
        text: 'Konfirmasi password tidak sesuai dengan password baru!',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    isSubmitting = true;

    try {
      // Kirim hanya password (email sudah ada di session dari OTP)
      const response = await fetch("/api/forget/change", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          password: newPassword
        })
      });

      const data = await response.json();

      if (response.status === 200) {
        showModal = false;
        newPassword = '';
        confirmPassword = '';
        
        Swal.fire({
          icon: 'success',
          title: 'Password Berhasil Diubah!',
          text: 'Silakan gunakan password baru Anda untuk login.',
          confirmButtonColor: '#0b5ba2',
          timer: 2500,
          showConfirmButton: false
        }).then(() => {
          // Redirect ke halaman login
          push('/signin');
        });
      } else {
        const errorMessage = data.errors || data.message || 'Gagal mengubah password';
        Swal.fire({
          icon: 'error',
          title: 'Gagal Ubah Password',
          text: errorMessage,
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan pada server. Silakan coba lagi.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      isSubmitting = false;
    }
  }

  // Back to Email Step
  function handleBackToEmail() {
    currentStep = 1;
    if (countdownTimer) clearInterval(countdownTimer);
    email = '';
    codes = ['', '', '', ''];
  }
</script>

<div class="min-h-screen bg-gray-700 flex items-center justify-center px-4 py-8 relative">
  <img src="src/assets/bg-login.jpg" alt="background" class="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none">
  
  <div class="w-full max-w-md relative z-10">
    <div class="border border-gray-200 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
      
      <div class="text-center px-6 pt-8 pb-2">
        <img src="src/assets/logo1.png" alt="logo" class="w-20 h-20 mx-auto mb-2">
        <p class="text-lg font-semibold text-gray-500 mt-3">LUPA PASSWORD</p>
      </div>

      {#if currentStep === 1}
        <!-- Input Email -->
        <form on:submit|preventDefault={handleSendOtp} class="p-6 space-y-5">
          <div class="space-y-2">
            <label for="email" class="block text-sm font-semibold text-gray-700"> Masukan Email Anda</label>
            <input
              id="email"
              type="email"
              placeholder="emailkamu@email.com"
              bind:value={email}
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
            />
          </div>
          <div class="pt-1 flex flex-col gap-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              class="w-full bg-[#0b5ba2] hover:bg-[#0b4c8d] text-white font-bold py-3 rounded-2xl transition-colors tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isSubmitting}
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menghubungkan...
              {:else}
                KIRIM OTP
              {/if}
            </button>
            <p class="text-sm text-gray-500 text-center">
              Kembali Ke Halaman Login ?{" "}
              <a href="#/signin" class="text-blue-500 font-semibold hover:underline">
                Klik Disini
              </a>
            </p>
          </div>
        </form>

      {:else if currentStep === 2}
        <!-- Verifikasi OTP -->
        <form on:submit|preventDefault={handleVerifyOtp} class="p-6 space-y-6">
          <div class="text-center">
            <p class="text-sm text-gray-400">Masukkan 4 digit kode verifikasi yang dikirim ke</p>
            <p class="text-sm font-semibold text-gray-700 mt-1">{email}</p>
          </div>

          <div class="flex justify-center gap-3">
            {#each codes as code, i}
              <input
                bind:this={inputs[i]}
                type="text"
                inputmode="numeric"
                maxlength="1"
                value={code}
                on:input={(e) => handleInput(i, e)}
                on:keydown={(e) => handleKeydown(i, e)}
                on:paste={handlePaste}
                disabled={isSubmitting}
                class="code-input w-16 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all
                       bg-white text-gray-800 shadow-sm disabled:opacity-50"
                autocomplete="off"
              />
            {/each}
          </div>

          <div class="pt-2 flex flex-col gap-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              class="w-full bg-[#0b5ba2] hover:bg-[#0b4c8d] text-white font-bold py-3 rounded-2xl transition-colors tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isSubmitting}
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Memverifikasi...
              {:else}
                VERIFIKASI
              {/if}
            </button>
            
            <div class="text-center">
              {#if countdown > 0}
                <p class="text-xs text-gray-400">Kirim ulang kode dalam <span class="font-semibold text-blue-600">{countdown}s</span></p>
              {:else}
                <button 
                  type="button" 
                  on:click={handleResendOtp}
                  disabled={isSubmitting}
                  class="text-xs text-blue-600 hover:text-blue-800 font-bold transition-colors hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Kirim Ulang Kode OTP
                </button>
              {/if}
            </div>

            <button
              type="button"
              on:click={handleBackToEmail}
              class="w-full text-sm text-gray-500 hover:text-gray-700 font-semibold py-1 transition-colors"
            >
              ← Ubah Email
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>

  <!-- Modal Ganti Password -->
  {#if showModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden">
        <div class="text-center px-6 pt-8 pb-2">
          <p class="text-lg font-semibold text-gray-500">GANTI PASSWORD BARU</p>
          <p class="text-sm text-gray-400 mt-1">Buat password baru untuk akun Anda</p>
        </div>
        
        <form on:submit|preventDefault={handleResetPassword} class="p-6 space-y-5">
          <div class="space-y-2">
            <label for="newPassword" class="block text-sm font-semibold text-gray-700">Password Baru</label>
            <div class="relative">
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="••••••••"
                bind:value={newPassword}
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors pr-10"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                on:click={() => showNewPassword = !showNewPassword}
              >
                {#if showNewPassword}
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18m-1.5-1.5a10.05 10.05 0 01-2.437 1.5M21.543 12c-1.275-4.057-5.065-7-9.543-7a9.97 9.97 0 00-3.13.5m5.424 2.89a3 3 0 013.856 3.856" /></svg>
                {:else}
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {/if}
              </button>
            </div>
          </div>
          
          <div class="space-y-2">
            <label for="confirmPassword" class="block text-sm font-semibold text-gray-700">Konfirmasi Password Baru</label>
            <div class="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                bind:value={confirmPassword}
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors pr-10"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                on:click={() => showConfirmPassword = !showConfirmPassword}
              >
                {#if showConfirmPassword}
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18m-1.5-1.5a10.05 10.05 0 01-2.437 1.5M21.543 12c-1.275-4.057-5.065-7-9.543-7a9.97 9.97 0 00-3.13.5m5.424 2.89a3 3 0 013.856 3.856" /></svg>
                {:else}
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {/if}
              </button>
            </div>
          </div>
          
          <div class="pt-1 flex flex-col gap-3">
            <button 
              type="submit" 
              disabled={isSubmitting}
              class="w-full bg-[#0b5ba2] hover:bg-[#0b4c8d] text-white font-bold py-3 rounded-2xl transition-colors tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isSubmitting}
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menyimpan...
              {:else}
                SIMPAN PASSWORD
              {/if}
            </button>
            <button 
              type="button" 
              on:click={() => {
                showModal = false;
                newPassword = '';
                confirmPassword = '';
              }}
              class="w-full text-sm text-gray-500 hover:text-gray-700 font-semibold py-2 transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  .code-input:focus {
    transform: scale(1.05);
    box-shadow: 0 0 0 3px rgba(11, 91, 162, 0.2);
  }
  .code-input::selection {
    background: transparent;
  }
</style>