import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const targetElement = document.getElementById('app')
if (!targetElement) {
  throw new Error('Target element with id "app" not found')
}
const app = mount(App, {
  target: targetElement,
})

export default app
