// Один источник правды о ширине экрана: брейкпоинт тот же, что в media-запросах компонентов.
import { ref } from 'vue';

const MOBILE_QUERY = '(max-width: 900px)';

const media = window.matchMedia(MOBILE_QUERY);
const isMobile = ref(media.matches);

function update(event) {
    isMobile.value = event.matches;
}

// addEventListener у MediaQueryList появился только в Safari 14 — старым отдаём addListener
if (media.addEventListener) {
    media.addEventListener('change', update);
} else {
    media.addListener(update);
}

export { isMobile, MOBILE_QUERY };
