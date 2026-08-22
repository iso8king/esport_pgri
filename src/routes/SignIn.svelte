<script>
  import { push } from 'svelte-spa-router';
  import Swal from "sweetalert2";
  import { onDestroy } from 'svelte';

  let email = '';
  let password = '';
  let showPassword = false;
  let activeTab = 'password'; // 'password' | 'face'

  // --- Face login state ---
  let videoEl;
  let canvasEl;
  let stream = null;
  let cameraReady = false;
  let capturing = false;

  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      videoEl.srcObject = stream;
      cameraReady = true;
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Kamera Tidak Bisa Diakses',
        text: 'Pastikan kamu sudah mengizinkan akses kamera di browser.',
        confirmButtonColor: '#ef4444'
      });
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    cameraReady = false;
  }

  function switchTab(tab) {
    if (tab === activeTab) return;
    activeTab = tab;
    if (tab === 'face') {
      startCamera();
    } else {
      stopCamera();
    }
  }

  onDestroy(() => {
    stopCamera();
  });

  function captureBlob() {
    return new Promise((resolve) => {
      const context = canvasEl.getContext('2d');
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
      context.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
      canvasEl.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  }

  async function handleFaceLogin() {
  if (!email) {
    Swal.fire({
      icon: 'warning',
      title: 'Email Wajib Diisi',
      text: 'Masukkan email kamu terlebih dahulu sebelum login dengan wajah.',
      confirmButtonColor: '#ef4444'
    });
    return;
  }

  if (!cameraReady) {
    Swal.fire({
      icon: 'warning',
      title: 'Kamera Belum Siap',
      text: 'Tunggu sebentar sampai kamera aktif.',
      confirmButtonColor: '#ef4444'
    });
    return;
  }

  capturing = true;
  try {
    const blob = await captureBlob();
    const formData = new FormData();
    formData.append('file', blob, 'face-login.jpg');
    formData.append('email', email);

    const res = await fetch('/api/users/login/face', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || 'Verifikasi wajah gagal');
    }

    localStorage.setItem("user_name", data.data.nama);
    localStorage.setItem("user_id", data.data.id);
    localStorage.setItem("user_role", data.data.role);
    localStorage.setItem("username", data.data.username);
    localStorage.setItem("user_game_id", data.data.game_id);
    localStorage.setItem("user_server_id", data.data.server_id);
    localStorage.setItem("role", data.data.role);
    localStorage.setItem("email", data.data.email);
    localStorage.setItem("status", data.data.status);
    localStorage.setItem("tim", data.data.member?.team?.nama_tim);
    localStorage.setItem("akun_dibuat", data.data.akun_dibuat);
    localStorage.setItem("user_avatar", data.data.pfp);
    localStorage.setItem("kelas", data.data.kelas || "")

    stopCamera();

    Swal.fire({
      icon: 'success',
      title: 'Login Berhasil!',
      text: `Selamat datang kembali, ${data.data.nama}!`,
      confirmButtonColor: '#3b82f6',
      timer: 2000,
      showConfirmButton: false
    }).then(() => {
      if (data.data.role === 'admin') {
        push('/admin/beranda');
      } else {
        push('/user/absensi');
      }
    });

  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'Login Gagal',
      text: err.message || 'Wajah tidak dikenali atau server error!',
      confirmButtonColor: '#ef4444'
    });
  } finally {
    capturing = false;
  }
}

  async function handleSubmit() {
    if (!email || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Tidak Lengkap',
        text: 'Pastikan email dan password sudah diisi!',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({ username: email, password })
      });

      if (!res.ok) {
        throw new Error("Login gagal");
      }

      const data = await res.json();

      localStorage.setItem("user_name", data.data.nama);
      localStorage.setItem("user_id", data.data.id);
      localStorage.setItem("user_role", data.data.role);
      localStorage.setItem("username", data.data.username);
      localStorage.setItem("user_game_id", data.data.game_id);
      localStorage.setItem("user_server_id", data.data.server_id);
      localStorage.setItem("role", data.data.role);
      localStorage.setItem("email", data.data.email);
      localStorage.setItem("status", data.data.status);
      localStorage.setItem("tim", data.data.tim);
      localStorage.setItem("akun_dibuat", data.data.akun_dibuat);
      localStorage.setItem("user_avatar", data.data.avatar);
      localStorage.setItem("kelas" , data.data.kelas)

      Swal.fire({
        icon: 'success',
        title: 'Login Berhasil!',
        text: `Selamat datang kembali, ${data.data.nama}!`,
        confirmButtonColor: '#3b82f6',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        if (data.data.role === 'admin') {
          push('/admin/beranda');
        } else {
          push('/user/absensi');
        }
      });

    } catch (err) {
      console.log(err);
      Swal.fire({
        icon: 'error',
        title: 'Login Gagal',
        text: 'Email atau Password salah atau server error!',
        confirmButtonColor: '#ef4444'
      });
    }
  }
</script>

<div class="min-h-screen bg-gray-700 flex items-center justify-center px-4 py-8 relative">
  <img src="/bg-login.jpg" alt="background" class="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none">
  <div class="w-full max-w-md relative z-10">
    <div class="border border-gray-200 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">

      <div class="text-center px-6 pt-8 pb-2">
        <img src="/logo1.png" alt="logo" class="w-20 h-20 mx-auto mb-2">
        <p class="text-lg font-semibold text-gray-500 mt-3">SIGN IN</p>
      </div>

      <!-- Tab switcher -->
      <div class="mx-6 mt-4 flex bg-gray-100 rounded-2xl p-1">
        <button
          type="button"
          on:click={() => switchTab('password')}
          class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors
            {activeTab === 'password' ? 'bg-[#0b5ba2] text-white shadow' : 'text-gray-500 hover:text-gray-700'}"
        >
          Password
        </button>
        <button
          type="button"
          on:click={() => switchTab('face')}
          class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors
            {activeTab === 'face' ? 'bg-[#0b5ba2] text-white shadow' : 'text-gray-500 hover:text-gray-700'}"
        >
          Wajah
        </button>
      </div>

      <!-- Email selalu tampil, dipakai kedua metode -->
      <div class="px-6 pt-5 space-y-2">
        <label for="email" class="block text-sm font-semibold text-gray-700">Email / Username</label>
        <input
          id="email"
          type="text"
          placeholder="emailkamu@email.com"
          bind:value={email}
          required
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
        />
      </div>

      {#if activeTab === 'password'}
        <form on:submit|preventDefault={handleSubmit} class="p-6 pt-4 space-y-5">
          <div class="space-y-2">
            <label for="password" class="block text-sm font-semibold text-gray-700">Password</label>
            <div class="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                bind:value={password}
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors pr-10"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                on:click={() => showPassword = !showPassword}
              >
                {#if showPassword}
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18m-1.5-1.5a10.05 10.05 0 01-2.437 1.5M21.543 12c-1.275-4.057-5.065-7-9.543-7a9.97 9.97 0 00-3.13.5m5.424 2.89a3 3 0 013.856 3.856" /></svg>
                {:else}
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {/if}
              </button>
            </div>
            <div class="text-right mt-1">
              <a href="#/forgetpassword" class="text-blue-500 font-semibold hover:underline">
                Lupa Password ?
              </a>
            </div>
          </div>
          <div class="pt-1 flex flex-col gap-4">
            <button type="submit" class="w-full bg-[#0b5ba2] hover:bg-[#0b4c8d] text-white font-bold py-3 rounded-2xl transition-colors tracking-wider">
              SIGN IN
            </button>
            <p class="text-sm text-gray-500 text-center">
              Belum punya akun ?
              <a href="#/SignUp" class="text-blue-500 font-semibold hover:underline">
                Daftar di sini
              </a>
            </p>
          </div>
        </form>
      {:else}
        <div class="p-6 pt-4 space-y-4">
          <div class="relative rounded-2xl overflow-hidden bg-gray-900 aspect-square">
            <!-- svelte-ignore a11y-media-has-caption -->
            <video
              bind:this={videoEl}
              autoplay
              playsinline
              muted
              class="w-full h-full object-cover scale-x-[-1]"
            ></video>
            <canvas bind:this={canvasEl} class="hidden"></canvas>

            {#if !cameraReady}
              <div class="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">
                Mengaktifkan kamera...
              </div>
            {/if}

            <div class="absolute inset-6 border-2 border-white/40 rounded-2xl pointer-events-none"></div>
          </div>

          <p class="text-xs text-gray-500 text-center">
            Posisikan wajah kamu di dalam kotak, lalu tekan tombol di bawah.
          </p>

          <button
            type="button"
            on:click={handleFaceLogin}
            disabled={capturing || !cameraReady}
            class="w-full bg-[#0b5ba2] hover:bg-[#0b4c8d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-colors tracking-wider flex items-center justify-center gap-2"
          >
            {#if capturing}
              <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Memverifikasi...
            {:else}
              Login dengan Wajah
            {/if}
          </button>

          <p class="text-sm text-gray-500 text-center">
            Belum punya akun ?
            <a href="#/SignUp" class="text-blue-500 font-semibold hover:underline">
              Daftar di sini
            </a>
          </p>
        </div>
      {/if}

    </div>
  </div>
</div>