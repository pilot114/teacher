<template>
  <div class="login">
    <form class="card" @submit.prevent="submit">
      <h1>Вход</h1>
      <p class="hint">Прогресс по темам хранится на сервере, поэтому нужен логин.</p>

      <label>
        <span>Логин</span>
        <input
            v-model="login"
            type="text"
            name="login"
            autocomplete="username"
            autocapitalize="off"
            spellcheck="false"
            ref="loginInput"
            :disabled="busy"
        >
      </label>

      <label>
        <span>Пароль</span>
        <input
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            :disabled="busy"
        >
      </label>

      <p class="error" v-if="error">{{ error }}</p>

      <button type="submit" :disabled="busy || !login || !password">
        {{ busy ? 'Проверяю…' : 'Войти' }}
      </button>
    </form>
  </div>
</template>

<script>
import { login } from '@/auth.js';

export default {
  name: 'LoginForm',
  emits: ['signed-in'],
  data() {
    return {
      login: '',
      password: '',
      error: '',
      busy: false,
    };
  },
  mounted() {
    this.$refs.loginInput.focus();
  },
  methods: {
    async submit() {
      if (this.busy) {
        return;
      }

      this.busy = true;
      this.error = '';

      try {
        const user = await login(this.login.trim(), this.password);
        this.password = '';
        this.$emit('signed-in', user);
      } catch (error) {
        this.error = error.message;
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>

<style scoped>
.login {
  display: flex;
  justify-content: center;
  padding: 60px 20px;
}

.card {
  width: 320px;
  padding: 24px 26px 26px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background-color: #ffffff;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
}

h1 {
  margin: 0;
}

.hint {
  margin: 6px 0 18px;
  font-size: 13px;
  color: #888;
}

label {
  display: block;
  margin-bottom: 14px;
}

label span {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: #555;
}

input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #c4c4c4;
  border-radius: 6px;
}

input:focus {
  outline: 2px solid #1a63c4;
  outline-offset: -1px;
  border-color: #1a63c4;
}

.error {
  margin: 0 0 12px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: #8a1c1c;
  background-color: #fdecec;
}

button {
  width: 100%;
  padding: 9px 16px;
  border: 1px solid #1a63c4;
  border-radius: 6px;
  background-color: #1a63c4;
  color: #ffffff;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 900px) {
  .login {
    padding: 24px 16px calc(24px + env(safe-area-inset-bottom));
  }

  .card {
    width: 100%;
    max-width: 360px;
    padding: 20px 18px 22px;
  }

  input {
    padding: 10px;
  }

  button {
    padding: 12px 16px;
  }
}
</style>
