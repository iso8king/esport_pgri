<script>
  import { push } from 'svelte-spa-router';
  import Swal from "sweetalert2";

  let codes = ['', '', '', ''];
  let inputs = [];

  // const VALID_CODE = '1234';

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


  async function handleVerify(){
    const code = codes.join('');
    console.log(code);

    try {
          const response = await fetch("/api/users/verify", {
            method : "POST",
            headers: {
          'Content-Type': 'application/json'
           },
          credentials: 'include',
          body: JSON.stringify({ 
               otp: code.replace(/,/g, '') // Kirim kode OTP
          })
          });

          if(response.status !== 200){
            Swal.fire({
        icon: 'error',
        title: 'Verifikasi Gagal',
        text: 'Kode verifikasi yang kamu masukkan salah!',
        confirmButtonColor: '#ef4444'
         });
        codes = ['', '', '', ''];
        inputs[0]?.focus();
          } else{
            Swal.fire({
        icon: 'success',
        title: 'Verifikasi Berhasil!',
        text: `Selamat akun kamu sudah aktif!`,
        confirmButtonColor: '#3b82f6',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
      localStorage.setItem("status" , 'true')
        if (localStorage.getItem("role") === 'admin') {
           localStorage.setItem("status" , "true");
          push('/admin/beranda');
        } else {
          push('/user/absensi');
        }
      });
          }
      
    } catch (e) {
        console.error("Error : ", e)
    }
  }

  function handleBack() {
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    push('/signin');
  }
</script>

<div class="min-h-screen bg-gray-700 flex items-center justify-center px-4">
  <div class="w-full max-w-md">
  <img src="src/assets/bglogin.jpg" alt="background" class="absolute inset-0 w-full h-full object-cover opacity-20">
    <div class="border border-gray-200 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden relative z-10">
      
      <div class="text-center px-6 pt-8 pb-2">
        <img src="src/assets/logo.png" alt="logo" class="w-20 h-20 mx-auto mb-2">
        <p class="text-lg font-semibold text-gray-500 mt-3">VERIFIKASI KODE</p>
        <p class="text-sm text-gray-400 mt-2">Masukkan 4 digit kode verifikasi</p>
      </div>

      <form on:submit|preventDefault={handleVerify} class="p-6 space-y-6">
        
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
              class="code-input w-16 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all
                     bg-white text-gray-800 shadow-sm"
              autocomplete="off"
            />
          {/each}
        </div>

        <div class="pt-2 flex flex-col gap-4">
          <button type="submit" class="w-full bg-[#0b5ba2] hover:bg-[#0b4c8d] text-white font-bold py-3 rounded-2xl transition-colors tracking-wider">
            VERIFIKASI
          </button>
          <button
            type="button"
            on:click={handleBack}
            class="w-full text-sm text-gray-500 hover:text-gray-700 font-semibold py-2 transition-colors"
          >
            ← Kembali ke halaman login
          </button>
        </div>

      </form>
    </div>

  </div>
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
