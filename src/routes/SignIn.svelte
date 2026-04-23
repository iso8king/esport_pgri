<script>
  import { push } from 'svelte-spa-router';
  import Swal from "sweetalert2";
  let email = '';
  let password = '';
  let showPassword = false;

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
    const res = await fetch("http://localhost:9999/api/users/login", {
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
    console.log("Response JSON:", data);
    
    // Cek apakah ada cookie yang diset
    const setCookieHeader = res.headers.get('set-cookie');
    console.log("Set-Cookie header:", setCookieHeader);

    // Simpan ke localStorage
    localStorage.setItem("user_name", data.data.nama);
    localStorage.setItem("user_id", data.data.id);
    localStorage.setItem("user_role", data.data.role);
    localStorage.setItem("username", data.data.username);
    localStorage.setItem("user_game_id", data.data.game_id);
    localStorage.setItem("user_server_id", data.data.server_id);

    Swal.fire({
      icon: 'success',
      title: 'Login Berhasil!',
      text: `Selamat datang kembali, ${data.data.nama}!`,
      confirmButtonColor: '#3b82f6',
      timer: 2000,
      showConfirmButton: false
    }).then(() => {
      if (data.data.role === 'admin') {
        push('/admin');
      } else {
        push('/user_absensi');
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

<div class="min-h-screen bg-gray-700 flex items-center justify-center px-4">
  <div class="w-full max-w-md">
  <img src="src/assets/bglogin.jpg" alt="background" class="absolute inset-0 w-full h-full object-cover opacity-20">
    <div class="border border-gray-200 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden relative z-10">
      
      <div class="text-center px-6 pt-8 pb-2">
      <img src="src/assets/logo.png" alt="logo" class="w-20 h-20 mx-auto mb-2">
        <p class="text-lg font-semibold text-gray-500 mt-3">SIGN IN</p>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-5">
        
        <div class="space-y-2">
          <label for="email" class="block text-sm font-semibold text-gray-700"> Email</label>
          <input
            id="email"
            type="text"
            placeholder="emailkamu@email.com"
            bind:value={email}
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
          />
        </div>

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
        </div>

        <div class="pt-4 flex flex-col gap-4">
          <button type="submit" class="w-full bg-[#0b5ba2] hover:bg-[#0b4c8d] text-white font-bold py-3 rounded-2xl transition-colors tracking-wider">
            SIGN IN
          </button>
          <p class="text-sm text-gray-500 text-center">
            Belum punya akun ?{" "}
            <a href="#/SignUp" class="text-blue-500 font-semibold hover:underline">
              Daftar di sini
            </a>
          </p>
        </div>

      </form>
    </div>

  </div>
</div>