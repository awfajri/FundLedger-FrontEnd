import './assets/main.css'
import 'primeicons/primeicons.css'

// Prevent PrimeVue runtime license banner from rendering
if (typeof document !== 'undefined' && !document.getElementById('p-license-host')) {
  const dummyHost = document.createElement('div')
  dummyHost.id = 'p-license-host'
  dummyHost.style.display = 'none'
  document.body?.appendChild(dummyHost)
}

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'

import App from './App.vue'
import router from './core/router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark',
    },
  },
})

app.mount('#app')
