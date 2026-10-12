<template>
  <div class="header">
    <nav class="main-menu">
      <button
          type="button"
          class="burger"
          :class="{open: menuOpen}"
          :aria-expanded="String(menuOpen)"
          aria-label="Меню разделов"
          @click="menuOpen = !menuOpen"
      >
        <span></span><span></span><span></span>
      </button>
      <span class="current-section">{{ selectedSection }}</span>

      <div class="menu-panel" :class="{open: menuOpen}">
        <ul>
          <li
              v-for="section in sections"
              :key="section"
              :class="{ active: selectedSection === section }"
              @click="selectSection(section)"
          >
            {{ section }}
          </li>
        </ul>
        <div class="account" v-if="user">
          <span class="account-name">{{ user.name || user.login }}</span>
          <button type="button" @click="$emit('sign-out')">Выйти</button>
        </div>
      </div>
    </nav>
    <div class="menu-backdrop" v-if="menuOpen" @click="menuOpen = false"></div>

    <nav class="sub-menu" v-if="selectedSection === 'Практика'" ref="subMenu">
      <ul>
        <li
            v-for="section in practiceSections"
            :key="section"
            :class="{ active: selectedPractice === section }"
            @click="selectPractice(section)"
        >
          {{ section }}
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>
import {practiceSections, sections} from "@/sections.js";

export default {
  name: 'HeaderMenu',
  props: ['selectedSection', 'selectedPractice', 'user'],
  emits: ['update:selectedSection', 'update:selectedPractice', 'sign-out'],
  data() {
    return {
      sections: sections,
      practiceSections: practiceSections,
      menuOpen: false,
    };
  },
  mounted() {
    this.$nextTick(this.revealPractice);
  },
  watch: {
    selectedSection() {
      this.$nextTick(this.revealPractice);
    },
    selectedPractice() {
      this.$nextTick(this.revealPractice);
    },
  },
  methods: {
    // строка подразделов прокручивается — выбранный не должен остаться за краем
    revealPractice() {
      const active = this.$refs.subMenu?.querySelector('li.active');
      if (active) {
        active.scrollIntoView({block: 'nearest', inline: 'center'});
      }
    },
    selectSection(section) {
      this.menuOpen = false;
      this.$emit('update:selectedSection', section);
    },
    selectPractice(section) {
      this.$emit('update:selectedPractice', section);
    },
  }
};
</script>

<style>
.sub-menu {
  background-color: #f0f0f0;
  border-bottom: 1px solid #ccc;
  padding: 8px 10px;
}

.sub-menu ul {
  list-style: none;
  display: flex;
  padding: 0;
  margin: 0;
}

.sub-menu li {
  margin-right: 20px;
  cursor: pointer;
  color: #333;
}

.sub-menu li.active {
  font-weight: bold;
  text-decoration: underline;
}

.main-menu {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
  background-color: #333;
  color: white;
  padding: 10px;
  padding-left: max(10px, env(safe-area-inset-left));
  padding-right: max(10px, env(safe-area-inset-right));
}

/* на широком экране панель не существует как коробка — пункты лежат прямо в строке */
.menu-panel {
  display: contents;
}

.burger,
.current-section,
.menu-backdrop {
  display: none;
}

.account {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.account-name {
  color: #cfcfcf;
  font-size: 14px;
}

.account button {
  padding: 3px 10px;
  border: 1px solid #6d6d6d;
  border-radius: 4px;
  background: none;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
}

.account button:hover {
  border-color: #ffffff;
}

.main-menu ul {
  list-style: none;
  display: flex;
  padding: 0;
  margin: 0;
}

.main-menu li {
  margin-right: 20px;
  cursor: pointer;
}

.main-menu li.active {
  font-weight: bold;
  text-decoration: underline;
}

@media (max-width: 900px) {
  .main-menu {
    gap: 12px;
    min-height: 48px;
  }

  .burger {
    display: flex;
    flex: none;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    width: 40px;
    height: 40px;
    padding: 0 9px;
    border: none;
    border-radius: 6px;
    background: none;
    cursor: pointer;
  }

  .burger span {
    display: block;
    height: 2px;
    border-radius: 2px;
    background-color: #ffffff;
    transition: transform 0.2s, opacity 0.2s;
  }

  .burger.open span:nth-child(1) {
    transform: translateY(6px) rotate(45deg);
  }

  .burger.open span:nth-child(2) {
    opacity: 0;
  }

  .burger.open span:nth-child(3) {
    transform: translateY(-6px) rotate(-45deg);
  }

  .current-section {
    display: block;
    overflow: hidden;
    font-weight: bold;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* выпадающая панель: разделы и аккаунт одним столбцом */
  .menu-panel {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 30;
    display: none;
    flex-direction: column;
    padding: 6px 0;
    background-color: #333;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  }

  .menu-panel.open {
    display: flex;
  }

  .menu-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 25;
  }

  .main-menu ul {
    flex-direction: column;
  }

  .main-menu li {
    margin-right: 0;
    padding: 11px 16px;
  }

  .main-menu li.active {
    background-color: #454545;
  }

  .account {
    margin: 4px 0 0;
    padding: 10px 16px 4px;
    border-top: 1px solid #4a4a4a;
  }

  .account-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .account button {
    margin-left: auto;
    padding: 7px 14px;
  }

  /* подразделы практики не влезают в строку — катаем их вбок */
  .sub-menu {
    padding: 6px 0;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .sub-menu::-webkit-scrollbar {
    display: none;
  }

  .sub-menu ul {
    width: max-content;
    padding: 0 10px;
    gap: 8px;
  }

  .sub-menu li {
    margin-right: 0;
    padding: 9px 14px;
    border: 1px solid #d5d5d5;
    border-radius: 16px;
    background-color: #ffffff;
    font-size: 14px;
    white-space: nowrap;
  }

  .sub-menu li.active {
    border-color: #1a63c4;
    background-color: #1a63c4;
    color: #ffffff;
    text-decoration: none;
  }
}
</style>
