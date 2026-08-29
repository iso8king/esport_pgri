<script>
    import Router from 'svelte-spa-router';
    import Dashboard from './routes/Dashboard.svelte';
    import Home from './routes/Home.svelte';
    import Hub from './routes/Hub.svelte';
    import Admin from './routes/Admin/Admin.svelte';
    import Admin_anggota from './routes/Admin/Admin_anggota.svelte';
    import Admin_absensi from './routes/Admin/Admin_absensi.svelte';
    import Admin_analisis from './routes/Admin/Admin_analisis.svelte';
    import Admin_jadwal from './routes/Admin/Admin_jadwal.svelte';
    import Admin_berita from './routes/Admin/Admin_berita.svelte';
    import Admin_Setting from './routes/Admin/Admin_Setting.svelte';
    import SignIn from './routes/SignIn.svelte';
    import SignUp from './routes/SignUp.svelte';
    import Verification from './routes/Verification.svelte';
    import User from './routes/User/User.svelte';
    import User_absensi from './routes/User/User_absensi.svelte';
    import User_kegiatan from './routes/User/User_kegiatan.svelte';
    import User_setting from './routes/User/User_setting.svelte';
    import User_analisis from './routes/User/User_analisis.svelte';
    import ForgetPassword from './routes/ForgetPassword.svelte';
    import { onMount, onDestroy } from 'svelte';
    import { initSession, stopSessionCheck, isAuthenticated } from '$lib/auth.js';

    onMount(() => {
        if (isAuthenticated()) {
            initSession();
        }
    });

    onDestroy(() => {
        stopSessionCheck();
    });


    const routes = {
        '/': Dashboard,

        '/signin': SignIn,
        '/signup': SignUp,
        '/forgetpassword': ForgetPassword,
        '/verification': Verification,

        '/admin/beranda': Admin,
        '/admin/anggota': Admin_anggota,
        '/admin/absensi': Admin_absensi,
        '/admin/analisis': Admin_analisis,
        '/admin/jadwal': Admin_jadwal,
        '/admin/berita': Admin_berita,
        '/admin/settings': Admin_Setting,


        '/user/absensi': User_absensi,
        '/user/kegiatan': User_kegiatan,
        '/user/settings': User_setting,
        '/user/analisis': User_analisis,
        '/hub' : Hub

        //'/user': Home,
        //'/admin': Admin,

    };
</script>

<main>
    <Router {routes} />
</main>