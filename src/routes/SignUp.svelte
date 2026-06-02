<script>
  import { push } from "svelte-spa-router";
  import Swal from "sweetalert2";

  let nama = "";
  let username = "";
  let email = "";
  let game_id = "";
  let server_id = "";
  let password = "";
  let confirmPassword = "";
  let showPassword = false;
  let showConfirmPassword = false;
  let isLoading = false;

  async function handleSubmit() {
    // Validasi
    if (!nama || !username || !email || !game_id || !server_id || !password || !confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Tidak Lengkap',
        text: 'Pastikan semua field sudah diisi!',
        confirmButtonColor: '#0b5ba2'
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Password Tidak Cocok',
        text: 'Password dan konfirmasi password harus sama!',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    if (password.length <= 8) {
      Swal.fire({
        icon: 'error',
        title: 'Password Terlalu Pendek',
        text: 'Password minimal 8 karakter!',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    isLoading = true;

    try {
      const response = await fetch("http://localhost:9999/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nama: nama,
          username: username,
          email: email,
          game_id: game_id,
          server_id: server_id,
          password: password
        })
      });

      const data = await response.json();

      if (response.status != 200) {
        throw new Error(data.message || "Registrasi gagal");
      }

      Swal.fire({
        icon: 'success',
        title: 'Registrasi Berhasil!',
        text: 'Silakan login dan aktivasi akun anda setelah login!',
        confirmButtonColor: '#0b5ba2'
      }).then(() => {
        push('/SignIn');
      });

    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Registrasi Gagal',
        text: err.message || 'Terjadi kesalahan pada server',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-700 flex items-center justify-center px-4 py-8">
  <div class="w-full max-w-md">
    <img src="src/assets/bg-login.jpg" alt="background" class="absolute inset-0 w-full h-full object-cover opacity-20">
    
    <div class="border border-gray-200 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden relative z-10">
      
      <div class="text-center px-6 pt-8 pb-2">
        <img src="src/assets/logo1.png" alt="logo" class="w-20 h-20 mx-auto mb-2">
        <p class="text-lg font-semibold text-gray-500 mt-3">SIGN UP</p>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-4">
        
        <!-- Nama Lengkap -->
        <div class="space-y-2">
          <label for="FullName" class="block text-sm font-semibold text-gray-700">Nama Lengkap</label>
          <input
            id="FullName"
            type="text"
            placeholder="Masukkan Nama Lengkap"
            bind:value={nama}
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b5ba2] focus:border-[#0b5ba2] outline-none transition-colors"
          />
        </div>

        <!-- Username -->
        <div class="space-y-2">
          <label for="Username" class="block text-sm font-semibold text-gray-700">Username</label>
          <input
            id="Username"
            type="text"
            placeholder="Masukkan Username"
            bind:value={username}
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b5ba2] focus:border-[#0b5ba2] outline-none transition-colors"
          />
        </div>

        <!-- Email -->
        <div class="space-y-2">
          <label for="email" class="block text-sm font-semibold text-gray-700">Email</label>
          <input
            id="email"
            type="email"
            placeholder="kamu@email.com"
            bind:value={email}
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b5ba2] focus:border-[#0b5ba2] outline-none transition-colors"
          />
        </div>

        <!-- Game ID & Server ID dalam satu row (2 kolom) -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-2">
            <label for="game_id" class="block text-sm font-semibold text-gray-700">Game ID</label>
            <input
              id="game_id"
              type="text"
              placeholder="Game ID"
              bind:value={game_id}
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b5ba2] focus:border-[#0b5ba2] outline-none transition-colors"
            />
          </div>

          <div class="space-y-2">
            <label for="server_id" class="block text-sm font-semibold text-gray-700">Server ID</label>
            <input
              id="server_id"
              type="text"
              placeholder="Server ID"
              bind:value={server_id}
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b5ba2] focus:border-[#0b5ba2] outline-none transition-colors"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="space-y-2">
          <label for="password" class="block text-sm font-semibold text-gray-700">Password</label>
          <div class="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              bind:value={password}
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b5ba2] focus:border-[#0b5ba2] outline-none transition-colors pr-10"
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
        </div>

        <!-- Konfirmasi Password -->
        <div class="space-y-2">
          <label for="confirmPassword" class="block text-sm font-semibold text-gray-700">Konfirmasi Password</label>
          <div class="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              bind:value={confirmPassword}
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b5ba2] focus:border-[#0b5ba2] outline-none transition-colors pr-10"
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

        <!-- Tombol Submit -->
        <div class="pt-4 flex flex-col gap-4">
          <button 
            type="submit" 
            disabled={isLoading}
            class="w-full bg-[#0b5ba2] hover:bg-[#0b4c8d] text-white font-bold py-3 rounded-2xl transition-colors tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isLoading}
              <svg class="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            {:else}
              SIGN UP
            {/if}
          </button>
          
          <p class="text-sm text-gray-500 text-center">
            Sudah punya akun?{" "}
            <a href="#/SignIn" class="text-blue-500 font-semibold hover:underline">
              Login di sini
            </a>
          </p>
        </div>

      </form>
    </div>
  </div>
</div>