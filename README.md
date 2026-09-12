# DARK Games v5.3 — Railway Ready

Это версия v5.2 с доработкой хранения данных для Railway. Дизайн, аккаунты, CMS, персонализация и роли сохранены.

## Что изменилось

- SQLite и все загружаемые изображения теперь могут жить внутри **одного постоянного каталога** `DATA_DIR`.
- По умолчанию локально используется `./data`.
- Изображения теперь сохраняются в `data/uploads/`, а наружу по-прежнему доступны как `/uploads/...`.
- Старые картинки из `public/uploads/` при запуске автоматически копируются в новое хранилище, если их там ещё нет.
- Добавлен `/api/health` для проверки состояния приложения.
- Railway автоматически распознаётся как reverse proxy.
- В production secure-cookie включается автоматически.
- Node.js закреплён на ветке 24.x.

## Локальный запуск

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Открывай:

```text
http://localhost:3000
```

Твои локальные данные будут храниться в:

```text
data/dark-games.db
data/uploads/
```

## Если обновляешься с v5.2

Сохрани свои:

```text
.env
data/dark-games.db
public/uploads/
```

Можно распаковать v5.3 в новую папку, затем перенести туда `.env` и `data/dark-games.db`. Старые изображения из `public/uploads/` тоже перенеси, если они есть. При первом запуске они автоматически скопируются в `data/uploads/`.

Не удаляй старый проект, пока не убедишься, что новая версия работает.

# Railway — короткая настройка

## 1. GitHub

Загрузи проект в GitHub. `.env`, база и пользовательские изображения специально исключены через `.gitignore`.

## 2. Railway

Создай проект из GitHub-репозитория. Railway должен автоматически выполнить установку зависимостей и `npm start`.

## 3. Variables

В Railway добавь переменные:

```env
NODE_ENV=production
JWT_SECRET=сюда_длинный_секрет_не_короче_32_символов
ADMIN_USERNAME=darkadmin
ADMIN_PASSWORD=твой_пароль
DATA_DIR=/app/data
SITE_SERVER_IP=darkgamespro.falix.pro
MINECRAFT_VERSION=1.21.1
```

`PORT` вручную на Railway задавать не нужно.

Для Discord потом добавь:

```env
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_REDIRECT_URI=https://ТВОЙ-ДОМЕН/auth/discord/callback
```

## 4. Persistent Volume

Добавь к сервису **Volume** и укажи Mount Path:

```text
/app/data
```

Именно в нём будут находиться одновременно:

```text
/app/data/dark-games.db
/app/data/uploads/
```

Поэтому новые деплои сайта не должны стирать пользователей, новости, лор, настройки, аватары и баннеры.

## 5. Публичная ссылка

После успешного deploy открой настройки Networking и создай Railway domain. Полученную HTTPS-ссылку можно открывать с телефона и отправлять другим людям.

## Проверка

После публикации открой:

```text
https://ТВОЙ-ДОМЕН/api/health
```

Нормальный ответ:

```json
{"ok":true}
```

## Важно про ADMIN_PASSWORD

Как и раньше, `ADMIN_PASSWORD` создаёт пароль первого администратора. Если администратор уже существует в постоянной базе, простое изменение этой переменной не меняет его существующий пароль.

## Основные команды

```powershell
npm run dev
npm start
npm run check
```
