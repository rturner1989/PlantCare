# PlantCare MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a plant care assistant app with a Rails 8 API backend and React frontend, featuring smart scheduling, plant personality/emotes, and a photo journal.

**Architecture:** Monorepo with `api/` (Rails 8 API-only) and `client/` (React via Vite). Docker Compose orchestrates all services. The API serves JSON under `/api/v1/`, React handles all UI and routing. JWT auth with access + refresh tokens.

**Tech Stack:** Rails 8, PostgreSQL, Redis, Sidekiq, React 18, Vite, TanStack Query, React Router, Tailwind CSS, ActiveStorage, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-04-03-plantcare-design.md`

---

## File Structure

### Backend (`api/`)

```
api/
├── Gemfile
├── Dockerfile
├── config/
│   ├── routes.rb
│   ├── database.yml
│   └── initializers/
│       └── cors.rb
├── app/
│   ├── models/
│   │   ├── user.rb
│   │   ├── room.rb
│   │   ├── plant.rb
│   │   ├── species.rb
│   │   ├── plant_photo.rb
│   │   ├── care_log.rb
│   │   └── refresh_token.rb
│   ├── controllers/
│   │   ├── application_controller.rb
│   │   ├── concerns/
│   │   │   └── authenticatable.rb
│   │   └── api/
│   │       └── v1/
│   │           ├── registrations_controller.rb
│   │           ├── sessions_controller.rb
│   │           ├── tokens_controller.rb
│   │           ├── rooms_controller.rb
│   │           ├── plants_controller.rb
│   │           ├── care_logs_controller.rb
│   │           ├── plant_photos_controller.rb
│   │           ├── species_controller.rb
│   │           ├── dashboard_controller.rb
│   │           └── profiles_controller.rb
│   └── services/
│       ├── jwt_service.rb
│       ├── schedule_calculator.rb
│       └── species_search_service.rb
├── db/
│   ├── migrate/
│   └── seeds/
│       └── species.rb
└── test/
    ├── models/
    ├── controllers/
    │   └── api/
    │       └── v1/
    └── services/
```

### Frontend (`client/`)

```
client/
├── Dockerfile
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
├── public/
│   └── manifest.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── api/
    │   └── client.js              # Axios instance, auth interceptor
    ├── hooks/
    │   ├── useAuth.js             # Auth context + hook
    │   ├── usePlants.js           # TanStack Query hooks for plants
    │   ├── useRooms.js            # TanStack Query hooks for rooms
    │   ├── useSpecies.js          # TanStack Query hooks for species
    │   └── useDashboard.js        # TanStack Query hook for dashboard
    ├── components/
    │   ├── Layout.jsx             # App shell (nav, sidebar)
    │   ├── ProtectedRoute.jsx     # Auth guard wrapper
    │   ├── PlantCard.jsx          # Plant card with emote + status
    │   ├── PlantEmote.jsx         # Emote face renderer
    │   ├── StatusMessage.jsx      # Personality-driven status text
    │   ├── CareButton.jsx         # Quick water/feed action
    │   ├── PhotoUpload.jsx        # Photo upload component
    │   ├── PhotoTimeline.jsx      # Chronological photo journal
    │   ├── SpeciesSearch.jsx      # Species search autocomplete
    │   └── EnvironmentForm.jsx    # Light/temp/humidity questions
    ├── pages/
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── Dashboard.jsx
    │   ├── Rooms.jsx
    │   ├── RoomDetail.jsx
    │   ├── PlantNew.jsx
    │   ├── PlantDetail.jsx
    │   └── Settings.jsx
    ├── personality/
    │   ├── emotes.js              # Emote state mapping
    │   └── messages.js            # Template messages per personality
    └── utils/
        └── careStatus.js          # Calculate plant care status from data
```

### Root

```
plant-care/
├── docker-compose.yml
├── .gitignore
├── api/
└── client/
```

---

## Task 1: Project Scaffolding & Docker

**Files:**
- Create: `plant-care/docker-compose.yml`
- Create: `plant-care/.gitignore`
- Create: `plant-care/api/Dockerfile`
- Create: `plant-care/api/Gemfile`
- Create: `plant-care/client/Dockerfile`
- Create: `plant-care/client/package.json`

- [ ] **Step 1: Create project root**

```bash
mkdir -p ~/Development/plant-care
cd ~/Development/plant-care
git init
```

- [ ] **Step 2: Create .gitignore**

```gitignore
# Ruby
api/tmp/
api/log/
api/.bundle/
api/vendor/bundle/
api/storage/

# Node
client/node_modules/
client/dist/

# Docker
.docker-data/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Superpowers
.superpowers/
docs/superpowers/
```

- [ ] **Step 3: Scaffold the Rails API**

```bash
cd ~/Development/plant-care
docker run --rm -v $(pwd):/app -w /app ruby:3.3 bash -c "
  gem install rails &&
  rails new api --api --database=postgresql --skip-git --skip-test --skip-system-test
"
```

Note: We skip the default test framework because we'll use Minitest with our own structure. Rails API mode excludes views, helpers, and assets automatically.

- [ ] **Step 4: Add required gems to api/Gemfile**

Add these gems to the Gemfile:

```ruby
# JWT
gem "jwt"

# CORS
gem "rack-cors"

# Background jobs
gem "sidekiq"

# Image processing (ActiveStorage)
gem "image_processing", "~> 1.2"

# HTTP client (for Perenual API)
gem "faraday"

group :development, :test do
  gem "debug", platforms: %i[mri windows], require: "debug/prelude"
  gem "factory_bot_rails"
  gem "faker"
end
```

- [ ] **Step 5: Create api/Dockerfile**

```dockerfile
FROM ruby:3.3

RUN apt-get update -qq && apt-get install -y \
  build-essential \
  libpq-dev \
  libvips \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY . .

EXPOSE 3000

CMD ["rails", "server", "-b", "0.0.0.0"]
```

- [ ] **Step 6: Scaffold the React app**

```bash
cd ~/Development/plant-care
docker run --rm -v $(pwd):/app -w /app node:20 bash -c "
  npm create vite@latest client -- --template react &&
  cd client &&
  npm install
"
```

- [ ] **Step 7: Install frontend dependencies**

```bash
cd ~/Development/plant-care/client
docker run --rm -v $(pwd):/app -w /app node:20 npm install \
  react-router-dom \
  @tanstack/react-query \
  axios \
  tailwindcss @tailwindcss/vite
```

- [ ] **Step 8: Create client/Dockerfile**

```dockerfile
FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
```

- [ ] **Step 9: Create docker-compose.yml**

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: plantcare
      POSTGRES_PASSWORD: plantcare_dev
      POSTGRES_DB: plantcare_development
    volumes:
      - .docker-data/postgres:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    volumes:
      - .docker-data/redis:/data
    ports:
      - "6379:6379"

  api:
    build: ./api
    command: bash -c "rm -f tmp/pids/server.pid && bundle exec rails server -b 0.0.0.0"
    volumes:
      - ./api:/app
      - api_bundle:/usr/local/bundle
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis
    environment:
      DATABASE_URL: postgres://plantcare:plantcare_dev@db:5432/plantcare_development
      REDIS_URL: redis://redis:6379/0
      RAILS_ENV: development
      JWT_SECRET: dev_jwt_secret_change_in_production

  sidekiq:
    build: ./api
    command: bundle exec sidekiq
    volumes:
      - ./api:/app
      - api_bundle:/usr/local/bundle
    depends_on:
      - db
      - redis
    environment:
      DATABASE_URL: postgres://plantcare:plantcare_dev@db:5432/plantcare_development
      REDIS_URL: redis://redis:6379/0
      RAILS_ENV: development

  client:
    build: ./client
    command: npm run dev -- --host
    volumes:
      - ./client:/app
      - client_node_modules:/app/node_modules
    ports:
      - "5173:5173"
    depends_on:
      - api

volumes:
  api_bundle:
  client_node_modules:
```

- [ ] **Step 10: Configure Rails database.yml to use DATABASE_URL**

Edit `api/config/database.yml`:

```yaml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  url: <%= ENV["DATABASE_URL"] %>

development:
  <<: *default

test:
  <<: *default
  url: <%= ENV["DATABASE_URL"]&.sub(/development/, "test") || "postgres://plantcare:plantcare_dev@localhost:5432/plantcare_test" %>

production:
  <<: *default
```

- [ ] **Step 11: Configure CORS**

Edit `api/config/initializers/cors.rb`:

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "http://localhost:5173"

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
```

- [ ] **Step 12: Configure Tailwind in Vite**

Edit `client/vite.config.js`:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://api:3000",
        changeOrigin: true,
      },
    },
  },
});
```

Replace the contents of `client/src/index.css` with:

```css
@import "tailwindcss";
```

- [ ] **Step 13: Build and boot everything**

```bash
cd ~/Development/plant-care
docker compose build
docker compose up -d
docker compose exec api rails db:create
```

Expected: All services start. Rails API responds at http://localhost:3000. React app loads at http://localhost:5173.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat: project scaffolding with Docker Compose

Rails 8 API + React/Vite + PostgreSQL + Redis + Sidekiq"
```

---

## Task 2: User Model & JWT Service

**Files:**
- Create: `api/app/models/user.rb`
- Create: `api/app/services/jwt_service.rb`
- Create: `api/db/migrate/xxx_create_users.rb`
- Create: `api/test/models/user_test.rb`
- Create: `api/test/services/jwt_service_test.rb`

- [ ] **Step 1: Generate the User model**

```bash
docker compose exec api rails generate model User \
  email:string:uniq \
  password_digest:string \
  name:string \
  timezone:string
```

- [ ] **Step 2: Edit the migration to add constraints**

Edit the generated migration file:

```ruby
class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :name, null: false
      t.string :timezone, default: "UTC"

      t.timestamps
    end

    add_index :users, :email, unique: true
  end
end
```

- [ ] **Step 3: Run the migration**

```bash
docker compose exec api rails db:migrate
```

Expected: Migration runs successfully.

- [ ] **Step 4: Write User model tests**

Create `api/test/models/user_test.rb`:

```ruby
require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "valid user" do
    user = User.new(email: "test@example.com", name: "Test", password: "password123", password_confirmation: "password123")
    assert user.valid?
  end

  test "requires email" do
    user = User.new(name: "Test", password: "password123", password_confirmation: "password123")
    assert_not user.valid?
    assert_includes user.errors[:email], "can't be blank"
  end

  test "requires unique email" do
    User.create!(email: "test@example.com", name: "Test", password: "password123", password_confirmation: "password123")
    user = User.new(email: "test@example.com", name: "Test2", password: "password123", password_confirmation: "password123")
    assert_not user.valid?
    assert_includes user.errors[:email], "has already been taken"
  end

  test "requires name" do
    user = User.new(email: "test@example.com", password: "password123", password_confirmation: "password123")
    assert_not user.valid?
    assert_includes user.errors[:name], "can't be blank"
  end

  test "requires password with minimum length" do
    user = User.new(email: "test@example.com", name: "Test", password: "short", password_confirmation: "short")
    assert_not user.valid?
    assert_includes user.errors[:password], "is too short (minimum is 8 characters)"
  end

  test "downcases email before save" do
    user = User.create!(email: "Test@Example.COM", name: "Test", password: "password123", password_confirmation: "password123")
    assert_equal "test@example.com", user.email
  end
end
```

- [ ] **Step 5: Implement User model**

Edit `api/app/models/user.rb`:

```ruby
class User < ApplicationRecord
  has_secure_password

  has_many :rooms, dependent: :destroy
  has_many :plants, through: :rooms
  has_many :refresh_tokens, dependent: :destroy

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :password, length: { minimum: 8 }, if: -> { new_record? || !password.nil? }

  before_save :downcase_email

  private def downcase_email
    self.email = email.downcase.strip
  end
end
```

- [ ] **Step 6: Run User model tests**

```bash
docker compose exec api rails test test/models/user_test.rb
```

Expected: All 6 tests pass.

- [ ] **Step 7: Write JwtService tests**

Create `api/test/services/jwt_service_test.rb`:

```ruby
require "test_helper"

class JwtServiceTest < ActiveSupport::TestCase
  test "encode and decode returns user_id" do
    token = JwtService.encode(user_id: 42)
    payload = JwtService.decode(token)
    assert_equal 42, payload[:user_id]
  end

  test "expired token returns nil" do
    token = JwtService.encode({ user_id: 42 }, expires_in: -1.minute)
    payload = JwtService.decode(token)
    assert_nil payload
  end

  test "invalid token returns nil" do
    payload = JwtService.decode("garbage.token.here")
    assert_nil payload
  end
end
```

- [ ] **Step 8: Implement JwtService**

Create `api/app/services/jwt_service.rb`:

```ruby
class JwtService
  SECRET = ENV.fetch("JWT_SECRET")

  def self.encode(payload, expires_in: 15.minutes)
    payload = payload.dup
    payload[:exp] = expires_in.from_now.to_i

    JWT.encode(payload, SECRET, "HS256")
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET, true, algorithm: "HS256")
    decoded.first.symbolize_keys
  rescue JWT::DecodeError
    nil
  end
end
```

- [ ] **Step 9: Run JwtService tests**

```bash
docker compose exec api rails test test/services/jwt_service_test.rb
```

Expected: All 3 tests pass.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: User model with has_secure_password and JWT service"
```

---

## Task 3: RefreshToken Model

**Files:**
- Create: `api/app/models/refresh_token.rb`
- Create: `api/db/migrate/xxx_create_refresh_tokens.rb`
- Create: `api/test/models/refresh_token_test.rb`

- [ ] **Step 1: Generate the RefreshToken model**

```bash
docker compose exec api rails generate model RefreshToken \
  user:references \
  token_digest:string \
  expires_at:datetime \
  revoked_at:datetime
```

- [ ] **Step 2: Edit the migration**

```ruby
class CreateRefreshTokens < ActiveRecord::Migration[8.0]
  def change
    create_table :refresh_tokens do |t|
      t.references :user, null: false, foreign_key: true
      t.string :token_digest, null: false
      t.datetime :expires_at, null: false
      t.datetime :revoked_at

      t.timestamps
    end

    add_index :refresh_tokens, :token_digest, unique: true
  end
end
```

- [ ] **Step 3: Run the migration**

```bash
docker compose exec api rails db:migrate
```

- [ ] **Step 4: Write RefreshToken model tests**

Create `api/test/models/refresh_token_test.rb`:

```ruby
require "test_helper"

class RefreshTokenTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(email: "test@example.com", name: "Test", password: "password123", password_confirmation: "password123")
  end

  test "generate creates token and returns raw value" do
    raw_token, refresh_token = RefreshToken.generate(@user)

    assert raw_token.present?
    assert refresh_token.persisted?
    assert_equal @user, refresh_token.user
    assert refresh_token.expires_at > Time.current
  end

  test "find_by_raw_token finds the correct record" do
    raw_token, _refresh_token = RefreshToken.generate(@user)

    found = RefreshToken.find_by_raw_token(raw_token)
    assert found.present?
    assert_equal @user, found.user
  end

  test "find_by_raw_token returns nil for invalid token" do
    found = RefreshToken.find_by_raw_token("invalid_token")
    assert_nil found
  end

  test "usable? returns false when revoked" do
    _raw_token, refresh_token = RefreshToken.generate(@user)
    refresh_token.update!(revoked_at: Time.current)

    assert_not refresh_token.usable?
  end

  test "usable? returns false when expired" do
    _raw_token, refresh_token = RefreshToken.generate(@user)
    refresh_token.update!(expires_at: 1.day.ago)

    assert_not refresh_token.usable?
  end

  test "revoke! sets revoked_at" do
    _raw_token, refresh_token = RefreshToken.generate(@user)
    refresh_token.revoke!

    assert refresh_token.revoked_at.present?
  end
end
```

- [ ] **Step 5: Implement RefreshToken model**

Edit `api/app/models/refresh_token.rb`:

```ruby
class RefreshToken < ApplicationRecord
  belongs_to :user

  def self.generate(user, expires_in: 30.days)
    raw_token = SecureRandom.urlsafe_base64(32)
    refresh_token = user.refresh_tokens.create!(
      token_digest: Digest::SHA256.hexdigest(raw_token),
      expires_at: expires_in.from_now
    )

    [raw_token, refresh_token]
  end

  def self.find_by_raw_token(raw_token)
    return nil unless raw_token.present?

    digest = Digest::SHA256.hexdigest(raw_token)
    find_by(token_digest: digest)
  end

  def usable?
    revoked_at.nil? && expires_at > Time.current
  end

  def revoke!
    update!(revoked_at: Time.current)
  end
end
```

- [ ] **Step 6: Run tests**

```bash
docker compose exec api rails test test/models/refresh_token_test.rb
```

Expected: All 6 tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: RefreshToken model with generation and validation"
```

---

## Task 4: Auth Controllers (Register, Login, Refresh, Logout)

**Files:**
- Create: `api/app/controllers/concerns/authenticatable.rb`
- Create: `api/app/controllers/api/v1/registrations_controller.rb`
- Create: `api/app/controllers/api/v1/sessions_controller.rb`
- Create: `api/app/controllers/api/v1/tokens_controller.rb`
- Modify: `api/config/routes.rb`
- Modify: `api/app/controllers/application_controller.rb`
- Create: `api/test/controllers/api/v1/registrations_controller_test.rb`
- Create: `api/test/controllers/api/v1/sessions_controller_test.rb`
- Create: `api/test/controllers/api/v1/tokens_controller_test.rb`

- [ ] **Step 1: Set up API routes**

Edit `api/config/routes.rb`:

```ruby
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      post "register", to: "registrations#create"
      post "login", to: "sessions#create"
      delete "logout", to: "sessions#destroy"
      post "refresh", to: "tokens#create"
    end
  end
end
```

- [ ] **Step 2: Implement Authenticatable concern**

Create `api/app/controllers/concerns/authenticatable.rb`:

```ruby
module Authenticatable
  extend ActiveSupport::Concern

  private def authenticate!
    token = request.headers["Authorization"]&.split(" ")&.last
    payload = JwtService.decode(token)

    if payload
      @current_user = User.find_by(id: payload[:user_id])
    end

    render json: { error: "Unauthorized" }, status: :unauthorized unless @current_user
  end

  private def current_user
    @current_user
  end

  private def set_refresh_token_cookie(raw_token)
    cookies[:refresh_token] = {
      value: raw_token,
      httponly: true,
      secure: Rails.env.production?,
      same_site: :lax,
      expires: 30.days.from_now,
      path: "/api/v1/refresh"
    }
  end

  private def clear_refresh_token_cookie
    cookies.delete(:refresh_token, path: "/api/v1/refresh")
  end
end
```

- [ ] **Step 3: Update ApplicationController**

Edit `api/app/controllers/application_controller.rb`:

```ruby
class ApplicationController < ActionController::API
  include ActionController::Cookies
  include Authenticatable
end
```

Note: We include `ActionController::Cookies` because Rails API mode doesn't include it by default, but we need it for the httpOnly refresh token cookie.

Also add cookies middleware in `api/config/application.rb`, inside the `Application` class:

```ruby
config.middleware.use ActionDispatch::Cookies
```

- [ ] **Step 4: Write registrations controller test**

Create `api/test/controllers/api/v1/registrations_controller_test.rb`:

```ruby
require "test_helper"

class Api::V1::RegistrationsControllerTest < ActionDispatch::IntegrationTest
  test "register with valid params creates user and returns token" do
    post api_v1_register_path, params: {
      user: { email: "new@example.com", name: "New User", password: "password123", password_confirmation: "password123" }
    }, as: :json

    assert_response :created
    json = JSON.parse(response.body)
    assert json["access_token"].present?
    assert json["user"]["id"].present?
    assert_equal "new@example.com", json["user"]["email"]
    assert_nil json["user"]["password_digest"]
  end

  test "register with invalid params returns errors" do
    post api_v1_register_path, params: {
      user: { email: "", name: "", password: "short" }
    }, as: :json

    assert_response :unprocessable_entity
    json = JSON.parse(response.body)
    assert json["errors"].present?
  end

  test "register with duplicate email returns error" do
    User.create!(email: "taken@example.com", name: "Existing", password: "password123", password_confirmation: "password123")

    post api_v1_register_path, params: {
      user: { email: "taken@example.com", name: "New", password: "password123", password_confirmation: "password123" }
    }, as: :json

    assert_response :unprocessable_entity
  end

  test "register sets refresh token cookie" do
    post api_v1_register_path, params: {
      user: { email: "new@example.com", name: "New User", password: "password123", password_confirmation: "password123" }
    }, as: :json

    assert_response :created
    assert cookies[:refresh_token].present?
  end
end
```

- [ ] **Step 5: Implement registrations controller**

Create `api/app/controllers/api/v1/registrations_controller.rb`:

```ruby
module Api
  module V1
    class RegistrationsController < ApplicationController
      def create
        user = User.new(user_params)

        if user.save
          access_token = JwtService.encode(user_id: user.id)
          raw_refresh, _refresh_token = RefreshToken.generate(user)
          set_refresh_token_cookie(raw_refresh)

          render json: {
            access_token: access_token,
            user: user_json(user)
          }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private def user_params
        params.require(:user).permit(:email, :name, :password, :password_confirmation)
      end

      private def user_json(user)
        { id: user.id, email: user.email, name: user.name, timezone: user.timezone }
      end
    end
  end
end
```

- [ ] **Step 6: Run registrations tests**

```bash
docker compose exec api rails test test/controllers/api/v1/registrations_controller_test.rb
```

Expected: All 4 tests pass.

- [ ] **Step 7: Write sessions controller test**

Create `api/test/controllers/api/v1/sessions_controller_test.rb`:

```ruby
require "test_helper"

class Api::V1::SessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(email: "test@example.com", name: "Test", password: "password123", password_confirmation: "password123")
  end

  test "login with valid credentials returns token" do
    post api_v1_login_path, params: { email: "test@example.com", password: "password123" }, as: :json

    assert_response :ok
    json = JSON.parse(response.body)
    assert json["access_token"].present?
    assert_equal @user.id, json["user"]["id"]
  end

  test "login with invalid password returns unauthorized" do
    post api_v1_login_path, params: { email: "test@example.com", password: "wrong" }, as: :json

    assert_response :unauthorized
    json = JSON.parse(response.body)
    assert_equal "Invalid email or password", json["error"]
  end

  test "login with unknown email returns unauthorized" do
    post api_v1_login_path, params: { email: "nobody@example.com", password: "password123" }, as: :json

    assert_response :unauthorized
  end

  test "login sets refresh token cookie" do
    post api_v1_login_path, params: { email: "test@example.com", password: "password123" }, as: :json

    assert_response :ok
    assert cookies[:refresh_token].present?
  end

  test "logout revokes refresh token and clears cookie" do
    post api_v1_login_path, params: { email: "test@example.com", password: "password123" }, as: :json
    raw_token = cookies[:refresh_token]

    delete api_v1_logout_path, as: :json

    assert_response :no_content
    refresh = RefreshToken.find_by_raw_token(raw_token)
    assert refresh.revoked_at.present?
  end
end
```

- [ ] **Step 8: Implement sessions controller**

Create `api/app/controllers/api/v1/sessions_controller.rb`:

```ruby
module Api
  module V1
    class SessionsController < ApplicationController
      def create
        user = User.find_by(email: params[:email]&.downcase&.strip)

        if user&.authenticate(params[:password])
          access_token = JwtService.encode(user_id: user.id)
          raw_refresh, _refresh_token = RefreshToken.generate(user)
          set_refresh_token_cookie(raw_refresh)

          render json: {
            access_token: access_token,
            user: { id: user.id, email: user.email, name: user.name, timezone: user.timezone }
          }
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end

      def destroy
        raw_token = cookies[:refresh_token]
        refresh = RefreshToken.find_by_raw_token(raw_token)
        refresh&.revoke!
        clear_refresh_token_cookie

        head :no_content
      end
    end
  end
end
```

- [ ] **Step 9: Run sessions tests**

```bash
docker compose exec api rails test test/controllers/api/v1/sessions_controller_test.rb
```

Expected: All 5 tests pass.

- [ ] **Step 10: Write tokens controller test**

Create `api/test/controllers/api/v1/tokens_controller_test.rb`:

```ruby
require "test_helper"

class Api::V1::TokensControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(email: "test@example.com", name: "Test", password: "password123", password_confirmation: "password123")
    @raw_token, @refresh_token = RefreshToken.generate(@user)
  end

  test "refresh with valid token returns new access token" do
    cookies[:refresh_token] = @raw_token

    post api_v1_refresh_path, as: :json

    assert_response :ok
    json = JSON.parse(response.body)
    assert json["access_token"].present?
  end

  test "refresh with revoked token returns unauthorized" do
    @refresh_token.revoke!
    cookies[:refresh_token] = @raw_token

    post api_v1_refresh_path, as: :json

    assert_response :unauthorized
  end

  test "refresh with expired token returns unauthorized" do
    @refresh_token.update!(expires_at: 1.day.ago)
    cookies[:refresh_token] = @raw_token

    post api_v1_refresh_path, as: :json

    assert_response :unauthorized
  end

  test "refresh without cookie returns unauthorized" do
    post api_v1_refresh_path, as: :json

    assert_response :unauthorized
  end
end
```

- [ ] **Step 11: Implement tokens controller**

Create `api/app/controllers/api/v1/tokens_controller.rb`:

```ruby
module Api
  module V1
    class TokensController < ApplicationController
      def create
        raw_token = cookies[:refresh_token]
        refresh = RefreshToken.find_by_raw_token(raw_token)

        if refresh&.usable?
          access_token = JwtService.encode(user_id: refresh.user_id)
          render json: { access_token: access_token }
        else
          render json: { error: "Invalid or expired refresh token" }, status: :unauthorized
        end
      end
    end
  end
end
```

- [ ] **Step 12: Run tokens tests**

```bash
docker compose exec api rails test test/controllers/api/v1/tokens_controller_test.rb
```

Expected: All 4 tests pass.

- [ ] **Step 13: Run all tests**

```bash
docker compose exec api rails test
```

Expected: All tests pass (User model: 6, JwtService: 3, RefreshToken: 6, Registrations: 4, Sessions: 5, Tokens: 4 = 28 total).

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat: auth system with register, login, logout, and token refresh"
```

---

## Task 5: Room Model & CRUD API

**Files:**
- Create: `api/app/models/room.rb`
- Create: `api/db/migrate/xxx_create_rooms.rb`
- Create: `api/app/controllers/api/v1/rooms_controller.rb`
- Create: `api/test/models/room_test.rb`
- Create: `api/test/controllers/api/v1/rooms_controller_test.rb`
- Modify: `api/config/routes.rb`

- [ ] **Step 1: Generate the Room model**

```bash
docker compose exec api rails generate model Room \
  user:references \
  name:string \
  icon:string
```

- [ ] **Step 2: Edit the migration**

```ruby
class CreateRooms < ActiveRecord::Migration[8.0]
  def change
    create_table :rooms do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :icon

      t.timestamps
    end
  end
end
```

- [ ] **Step 3: Run the migration**

```bash
docker compose exec api rails db:migrate
```

- [ ] **Step 4: Write Room model tests**

Create `api/test/models/room_test.rb`:

```ruby
require "test_helper"

class RoomTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(email: "test@example.com", name: "Test", password: "password123", password_confirmation: "password123")
  end

  test "valid room" do
    room = @user.rooms.new(name: "Living Room")
    assert room.valid?
  end

  test "requires name" do
    room = @user.rooms.new(name: "")
    assert_not room.valid?
    assert_includes room.errors[:name], "can't be blank"
  end

  test "requires user" do
    room = Room.new(name: "Living Room")
    assert_not room.valid?
  end
end
```

- [ ] **Step 5: Implement Room model**

Edit `api/app/models/room.rb`:

```ruby
class Room < ApplicationRecord
  belongs_to :user
  has_many :plants, dependent: :destroy

  validates :name, presence: true
end
```

- [ ] **Step 6: Run Room model tests**

```bash
docker compose exec api rails test test/models/room_test.rb
```

Expected: All 3 tests pass.

- [ ] **Step 7: Add rooms routes**

Update `api/config/routes.rb`:

```ruby
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      post "register", to: "registrations#create"
      post "login", to: "sessions#create"
      delete "logout", to: "sessions#destroy"
      post "refresh", to: "tokens#create"

      resources :rooms, only: [:index, :show, :create, :update, :destroy]
    end
  end
end
```

- [ ] **Step 8: Write rooms controller test**

Create a test helper method first. Add to `api/test/test_helper.rb`:

```ruby
ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    parallelize(workers: :number_of_processors)
  end
end

module AuthHelper
  def auth_headers(user)
    token = JwtService.encode(user_id: user.id)
    { "Authorization" => "Bearer #{token}" }
  end
end

class ActionDispatch::IntegrationTest
  include AuthHelper
end
```

Create `api/test/controllers/api/v1/rooms_controller_test.rb`:

```ruby
require "test_helper"

class Api::V1::RoomsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(email: "test@example.com", name: "Test", password: "password123", password_confirmation: "password123")
    @room = @user.rooms.create!(name: "Living Room", icon: "sofa")
  end

  test "index returns user rooms" do
    get api_v1_rooms_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal 1, json.length
    assert_equal "Living Room", json[0]["name"]
  end

  test "index excludes other users rooms" do
    other = User.create!(email: "other@example.com", name: "Other", password: "password123", password_confirmation: "password123")
    other.rooms.create!(name: "Other Room")

    get api_v1_rooms_path, headers: auth_headers(@user), as: :json

    json = JSON.parse(response.body)
    assert_equal 1, json.length
  end

  test "index requires authentication" do
    get api_v1_rooms_path, as: :json
    assert_response :unauthorized
  end

  test "show returns room with plant count" do
    get api_v1_room_path(@room), headers: auth_headers(@user), as: :json

    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal "Living Room", json["name"]
    assert_equal 0, json["plants_count"]
  end

  test "create with valid params" do
    post api_v1_rooms_path, headers: auth_headers(@user),
      params: { room: { name: "Bedroom", icon: "bed" } }, as: :json

    assert_response :created
    json = JSON.parse(response.body)
    assert_equal "Bedroom", json["name"]
  end

  test "create with invalid params" do
    post api_v1_rooms_path, headers: auth_headers(@user),
      params: { room: { name: "" } }, as: :json

    assert_response :unprocessable_entity
  end

  test "update room" do
    patch api_v1_room_path(@room), headers: auth_headers(@user),
      params: { room: { name: "Updated Room" } }, as: :json

    assert_response :ok
    assert_equal "Updated Room", @room.reload.name
  end

  test "destroy room" do
    assert_difference("Room.count", -1) do
      delete api_v1_room_path(@room), headers: auth_headers(@user), as: :json
    end

    assert_response :no_content
  end

  test "cannot access other users room" do
    other = User.create!(email: "other@example.com", name: "Other", password: "password123", password_confirmation: "password123")
    other_room = other.rooms.create!(name: "Other Room")

    get api_v1_room_path(other_room), headers: auth_headers(@user), as: :json
    assert_response :not_found
  end
end
```

- [ ] **Step 9: Implement rooms controller**

Create `api/app/controllers/api/v1/rooms_controller.rb`:

```ruby
module Api
  module V1
    class RoomsController < ApplicationController
      before_action :authenticate!
      before_action :set_room, only: [:show, :update, :destroy]

      def index
        rooms = current_user.rooms.select("rooms.*, (SELECT COUNT(*) FROM plants WHERE plants.room_id = rooms.id) AS plants_count")
        render json: rooms.map { |r| room_json(r) }
      end

      def show
        render json: room_json(@room).merge(plants_count: @room.plants.count)
      end

      def create
        room = current_user.rooms.new(room_params)

        if room.save
          render json: room_json(room), status: :created
        else
          render json: { errors: room.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @room.update(room_params)
          render json: room_json(@room)
        else
          render json: { errors: @room.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @room.destroy!
        head :no_content
      end

      private def set_room
        @room = current_user.rooms.find_by(id: params[:id])
        render json: { error: "Not found" }, status: :not_found unless @room
      end

      private def room_params
        params.require(:room).permit(:name, :icon)
      end

      private def room_json(room)
        {
          id: room.id,
          name: room.name,
          icon: room.icon,
          plants_count: room.try(:plants_count) || 0,
          created_at: room.created_at
        }
      end
    end
  end
end
```

- [ ] **Step 10: Run rooms controller tests**

```bash
docker compose exec api rails test test/controllers/api/v1/rooms_controller_test.rb
```

Expected: All 9 tests pass.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: Room model and CRUD API endpoints"
```

---

## Task 6: Species Model & Seed Data

**Files:**
- Create: `api/app/models/species.rb`
- Create: `api/db/migrate/xxx_create_species.rb`
- Create: `api/db/seeds/species.rb`
- Create: `api/test/models/species_test.rb`

- [ ] **Step 1: Generate the Species model**

```bash
docker compose exec api rails generate model Species \
  common_name:string \
  scientific_name:string \
  watering_frequency_days:integer \
  feeding_frequency_days:integer \
  light_requirement:string \
  humidity_preference:string \
  temperature_min:decimal \
  temperature_max:decimal \
  toxicity:string \
  difficulty:string \
  growth_rate:string \
  personality:string \
  description:text \
  care_tips:text \
  image_url:string \
  source:string \
  external_id:string
```

- [ ] **Step 2: Edit the migration**

```ruby
class CreateSpecies < ActiveRecord::Migration[8.0]
  def change
    create_table :species do |t|
      t.string :common_name, null: false
      t.string :scientific_name
      t.integer :watering_frequency_days, null: false
      t.integer :feeding_frequency_days
      t.string :light_requirement
      t.string :humidity_preference
      t.decimal :temperature_min, precision: 4, scale: 1
      t.decimal :temperature_max, precision: 4, scale: 1
      t.string :toxicity
      t.string :difficulty
      t.string :growth_rate
      t.string :personality, null: false, default: "chill"
      t.text :description
      t.text :care_tips
      t.string :image_url
      t.string :source, null: false, default: "seed"
      t.string :external_id

      t.timestamps
    end

    add_index :species, :common_name
    add_index :species, :scientific_name
    add_index :species, [:source, :external_id], unique: true, where: "external_id IS NOT NULL"
  end
end
```

- [ ] **Step 3: Run the migration**

```bash
docker compose exec api rails db:migrate
```

- [ ] **Step 4: Write Species model tests**

Create `api/test/models/species_test.rb`:

```ruby
require "test_helper"

class SpeciesTest < ActiveSupport::TestCase
  test "valid species" do
    species = Species.new(common_name: "Monstera", watering_frequency_days: 7, personality: "dramatic")
    assert species.valid?
  end

  test "requires common_name" do
    species = Species.new(watering_frequency_days: 7)
    assert_not species.valid?
    assert_includes species.errors[:common_name], "can't be blank"
  end

  test "requires watering_frequency_days" do
    species = Species.new(common_name: "Monstera")
    assert_not species.valid?
    assert_includes species.errors[:watering_frequency_days], "can't be blank"
  end

  test "search finds by common name" do
    Species.create!(common_name: "Monstera Deliciosa", watering_frequency_days: 7, personality: "dramatic")
    Species.create!(common_name: "Snake Plant", watering_frequency_days: 14, personality: "chill")

    results = Species.search("monstera")
    assert_equal 1, results.length
    assert_equal "Monstera Deliciosa", results.first.common_name
  end

  test "search finds by scientific name" do
    Species.create!(common_name: "Monstera", scientific_name: "Monstera deliciosa", watering_frequency_days: 7, personality: "dramatic")

    results = Species.search("deliciosa")
    assert_equal 1, results.length
  end
end
```

- [ ] **Step 5: Implement Species model**

Edit `api/app/models/species.rb`:

```ruby
class Species < ApplicationRecord
  has_many :plants, dependent: :nullify

  validates :common_name, presence: true
  validates :watering_frequency_days, presence: true, numericality: { greater_than: 0 }
  validates :personality, presence: true

  scope :search, ->(query) {
    where("common_name ILIKE :q OR scientific_name ILIKE :q", q: "%#{query}%")
  }
end
```

- [ ] **Step 6: Run Species model tests**

```bash
docker compose exec api rails test test/models/species_test.rb
```

Expected: All 5 tests pass.

- [ ] **Step 7: Create seed data**

Create `api/db/seeds/species.rb`:

```ruby
species_data = [
  {
    common_name: "Monstera Deliciosa",
    scientific_name: "Monstera deliciosa",
    watering_frequency_days: 7,
    feeding_frequency_days: 30,
    light_requirement: "bright_indirect",
    humidity_preference: "high",
    temperature_min: 18.0,
    temperature_max: 30.0,
    toxicity: "Toxic to pets and children",
    difficulty: "beginner",
    growth_rate: "fast",
    personality: "dramatic",
    description: "A popular tropical plant known for its large, split leaves. Native to Central American rainforests.",
    care_tips: "Likes to dry out slightly between waterings. Appreciates a moss pole for climbing. Wipe leaves to keep them dust-free."
  },
  {
    common_name: "Snake Plant",
    scientific_name: "Dracaena trifasciata",
    watering_frequency_days: 14,
    feeding_frequency_days: 60,
    light_requirement: "low_to_bright",
    humidity_preference: "low",
    temperature_min: 15.0,
    temperature_max: 30.0,
    toxicity: "Mildly toxic to pets",
    difficulty: "beginner",
    growth_rate: "slow",
    personality: "chill",
    description: "An extremely resilient plant with tall, upright leaves. One of the best air-purifying plants.",
    care_tips: "Very drought-tolerant. Overwatering is the most common mistake. Let soil dry completely between waterings."
  },
  {
    common_name: "Pothos",
    scientific_name: "Epipremnum aureum",
    watering_frequency_days: 7,
    feeding_frequency_days: 30,
    light_requirement: "low_to_bright_indirect",
    humidity_preference: "average",
    temperature_min: 15.0,
    temperature_max: 30.0,
    toxicity: "Toxic to pets and children",
    difficulty: "beginner",
    growth_rate: "fast",
    personality: "chill",
    description: "A trailing vine with heart-shaped leaves. Extremely easy to care for and propagate.",
    care_tips: "Tolerates low light but grows faster in bright indirect light. Let top inch of soil dry between waterings."
  },
  {
    common_name: "Cactus",
    scientific_name: "Cactaceae",
    watering_frequency_days: 21,
    feeding_frequency_days: 60,
    light_requirement: "bright_direct",
    humidity_preference: "low",
    temperature_min: 10.0,
    temperature_max: 35.0,
    toxicity: "Non-toxic (but spiny)",
    difficulty: "beginner",
    growth_rate: "slow",
    personality: "prickly",
    description: "Desert-adapted plants that store water in their stems. Come in a huge variety of shapes and sizes.",
    care_tips: "Water only when soil is completely dry. Needs lots of direct sunlight. Use well-draining cactus soil."
  },
  {
    common_name: "Boston Fern",
    scientific_name: "Nephrolepis exaltata",
    watering_frequency_days: 3,
    feeding_frequency_days: 30,
    light_requirement: "bright_indirect",
    humidity_preference: "high",
    temperature_min: 15.0,
    temperature_max: 25.0,
    toxicity: "Non-toxic",
    difficulty: "intermediate",
    growth_rate: "moderate",
    personality: "needy",
    description: "A lush, feathery fern that loves humidity. Beautiful hanging plant but requires consistent care.",
    care_tips: "Keep soil consistently moist but not soggy. Mist regularly or use a humidity tray. Brown tips mean it needs more humidity."
  },
  {
    common_name: "Fiddle Leaf Fig",
    scientific_name: "Ficus lyrata",
    watering_frequency_days: 10,
    feeding_frequency_days: 30,
    light_requirement: "bright_indirect",
    humidity_preference: "average",
    temperature_min: 16.0,
    temperature_max: 28.0,
    toxicity: "Toxic to pets",
    difficulty: "advanced",
    growth_rate: "moderate",
    personality: "dramatic",
    description: "A stunning tree with large, violin-shaped leaves. A statement plant that can be finicky about its environment.",
    care_tips: "Hates being moved. Sensitive to drafts and temperature changes. Water when top 2 inches of soil are dry. Wipe leaves monthly."
  },
  {
    common_name: "Spider Plant",
    scientific_name: "Chlorophytum comosum",
    watering_frequency_days: 7,
    feeding_frequency_days: 30,
    light_requirement: "bright_indirect",
    humidity_preference: "average",
    temperature_min: 13.0,
    temperature_max: 27.0,
    toxicity: "Non-toxic",
    difficulty: "beginner",
    growth_rate: "fast",
    personality: "chill",
    description: "A classic houseplant that produces baby spiderettes on long stems. Excellent air purifier.",
    care_tips: "Very forgiving. Brown tips usually mean fluoride in water — try filtered water. Produces babies when slightly root-bound."
  },
  {
    common_name: "Peace Lily",
    scientific_name: "Spathiphyllum",
    watering_frequency_days: 7,
    feeding_frequency_days: 30,
    light_requirement: "low_to_bright_indirect",
    humidity_preference: "high",
    temperature_min: 16.0,
    temperature_max: 27.0,
    toxicity: "Toxic to pets and children",
    difficulty: "beginner",
    growth_rate: "moderate",
    personality: "dramatic",
    description: "An elegant plant with glossy leaves and white flower-like spathes. Dramatically wilts when thirsty but recovers quickly.",
    care_tips: "Will dramatically droop when it needs water — don't panic, it recovers fast. Prefers filtered light. Blooms more with brighter light."
  },
  {
    common_name: "Aloe Vera",
    scientific_name: "Aloe barbadensis miller",
    watering_frequency_days: 14,
    feeding_frequency_days: 60,
    light_requirement: "bright_direct",
    humidity_preference: "low",
    temperature_min: 13.0,
    temperature_max: 30.0,
    toxicity: "Mildly toxic to pets (gel is safe for humans)",
    difficulty: "beginner",
    growth_rate: "moderate",
    personality: "stoic",
    description: "A practical succulent with thick, gel-filled leaves. The gel has soothing and healing properties.",
    care_tips: "Water deeply but infrequently. Must have well-draining soil. Leaves turning brown means too much direct sun."
  },
  {
    common_name: "Rubber Plant",
    scientific_name: "Ficus elastica",
    watering_frequency_days: 10,
    feeding_frequency_days: 30,
    light_requirement: "bright_indirect",
    humidity_preference: "average",
    temperature_min: 15.0,
    temperature_max: 28.0,
    toxicity: "Toxic to pets",
    difficulty: "beginner",
    growth_rate: "moderate",
    personality: "stoic",
    description: "A bold, architectural plant with thick, glossy leaves. Easier to care for than its relative the Fiddle Leaf Fig.",
    care_tips: "Wipe leaves to maintain their shine. Allow top inch of soil to dry between waterings. Can tolerate some neglect."
  },
  {
    common_name: "ZZ Plant",
    scientific_name: "Zamioculcas zamiifolia",
    watering_frequency_days: 14,
    feeding_frequency_days: 60,
    light_requirement: "low_to_bright_indirect",
    humidity_preference: "low",
    temperature_min: 15.0,
    temperature_max: 28.0,
    toxicity: "Toxic to pets and children",
    difficulty: "beginner",
    growth_rate: "slow",
    personality: "stoic",
    description: "Nearly indestructible with glossy, waxy leaves. Stores water in its rhizomes so tolerates serious neglect.",
    care_tips: "Thrives on neglect. Water only when completely dry. One of the best low-light plants. Avoid overwatering at all costs."
  },
  {
    common_name: "Calathea",
    scientific_name: "Calathea spp.",
    watering_frequency_days: 5,
    feeding_frequency_days: 30,
    light_requirement: "medium_indirect",
    humidity_preference: "high",
    temperature_min: 18.0,
    temperature_max: 27.0,
    toxicity: "Non-toxic",
    difficulty: "advanced",
    growth_rate: "moderate",
    personality: "needy",
    description: "Known for their stunning patterned leaves that fold up at night (prayer movements). Beautiful but demanding.",
    care_tips: "Very sensitive to tap water — use filtered or rainwater. Needs high humidity. Crispy edges mean low humidity. Keep soil evenly moist."
  },
  {
    common_name: "String of Pearls",
    scientific_name: "Senecio rowleyanus",
    watering_frequency_days: 14,
    feeding_frequency_days: 30,
    light_requirement: "bright_indirect",
    humidity_preference: "low",
    temperature_min: 15.0,
    temperature_max: 27.0,
    toxicity: "Toxic to pets and children",
    difficulty: "intermediate",
    growth_rate: "fast",
    personality: "dramatic",
    description: "A trailing succulent with round, bead-like leaves. Stunning in a hanging planter.",
    care_tips: "Water only when pearls start to look slightly deflated. Very prone to root rot if overwatered. Needs good drainage."
  },
  {
    common_name: "Jade Plant",
    scientific_name: "Crassula ovata",
    watering_frequency_days: 14,
    feeding_frequency_days: 60,
    light_requirement: "bright_direct",
    humidity_preference: "low",
    temperature_min: 10.0,
    temperature_max: 30.0,
    toxicity: "Toxic to pets",
    difficulty: "beginner",
    growth_rate: "slow",
    personality: "stoic",
    description: "A classic succulent that can live for decades, developing a thick trunk over time. Symbol of good luck.",
    care_tips: "Water when soil is completely dry. Can handle direct sun. Wrinkled leaves mean it needs water. Very long-lived with proper care."
  },
  {
    common_name: "Philodendron",
    scientific_name: "Philodendron spp.",
    watering_frequency_days: 7,
    feeding_frequency_days: 30,
    light_requirement: "bright_indirect",
    humidity_preference: "average",
    temperature_min: 16.0,
    temperature_max: 28.0,
    toxicity: "Toxic to pets and children",
    difficulty: "beginner",
    growth_rate: "fast",
    personality: "chill",
    description: "A diverse genus of tropical plants. Heart-leaf varieties trail beautifully, while tree types grow upright.",
    care_tips: "Easy-going and forgiving. Yellow leaves usually mean overwatering. Let top inch of soil dry between waterings."
  }
]

species_data.each do |data|
  Species.find_or_create_by!(common_name: data[:common_name]) do |s|
    s.assign_attributes(data.merge(source: "seed"))
  end
end

puts "Seeded #{species_data.length} plant species"
```

- [ ] **Step 8: Wire up the seed file**

Edit `api/db/seeds.rb`:

```ruby
load Rails.root.join("db/seeds/species.rb")
```

- [ ] **Step 9: Run seeds**

```bash
docker compose exec api rails db:seed
```

Expected: "Seeded 15 plant species"

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: Species model with 15 seeded houseplants and personality types"
```

---

## Task 7: Plant Model & Schedule Calculator

**Files:**
- Create: `api/app/models/plant.rb`
- Create: `api/db/migrate/xxx_create_plants.rb`
- Create: `api/app/services/schedule_calculator.rb`
- Create: `api/test/models/plant_test.rb`
- Create: `api/test/services/schedule_calculator_test.rb`

- [ ] **Step 1: Generate the Plant model**

```bash
docker compose exec api rails generate model Plant \
  room:references \
  species:references \
  nickname:string \
  notes:text \
  light_level:string \
  temperature_level:string \
  humidity_level:string \
  calculated_watering_days:integer \
  calculated_feeding_days:integer \
  last_watered_at:datetime \
  last_fed_at:datetime \
  acquired_at:date
```

- [ ] **Step 2: Edit the migration**

```ruby
class CreatePlants < ActiveRecord::Migration[8.0]
  def change
    create_table :plants do |t|
      t.references :room, null: false, foreign_key: true
      t.references :species, foreign_key: true
      t.string :nickname, null: false
      t.text :notes
      t.string :light_level, null: false, default: "medium"
      t.string :temperature_level, null: false, default: "average"
      t.string :humidity_level, null: false, default: "average"
      t.integer :calculated_watering_days
      t.integer :calculated_feeding_days
      t.datetime :last_watered_at
      t.datetime :last_fed_at
      t.date :acquired_at

      t.timestamps
    end
  end
end
```

- [ ] **Step 3: Run the migration**

```bash
docker compose exec api rails db:migrate
```

- [ ] **Step 4: Write ScheduleCalculator tests**

Create `api/test/services/schedule_calculator_test.rb`:

```ruby
require "test_helper"

class ScheduleCalculatorTest < ActiveSupport::TestCase
  setup do
    @species = Species.create!(
      common_name: "Monstera",
      watering_frequency_days: 7,
      feeding_frequency_days: 30,
      personality: "dramatic"
    )
  end

  test "returns base frequency for average conditions" do
    result = ScheduleCalculator.call(
      species: @species,
      light_level: "medium",
      temperature_level: "average",
      humidity_level: "average"
    )

    assert_equal 7, result[:watering_days]
    assert_equal 30, result[:feeding_days]
  end

  test "bright light and warm temp reduces watering interval" do
    result = ScheduleCalculator.call(
      species: @species,
      light_level: "bright",
      temperature_level: "warm",
      humidity_level: "average"
    )

    assert result[:watering_days] < 7, "Expected less than 7, got #{result[:watering_days]}"
  end

  test "low light and cool temp increases watering interval" do
    result = ScheduleCalculator.call(
      species: @species,
      light_level: "low",
      temperature_level: "cool",
      humidity_level: "average"
    )

    assert result[:watering_days] > 7, "Expected more than 7, got #{result[:watering_days]}"
  end

  test "high humidity increases watering interval" do
    result = ScheduleCalculator.call(
      species: @species,
      light_level: "medium",
      temperature_level: "average",
      humidity_level: "humid"
    )

    assert result[:watering_days] > 7, "Expected more than 7, got #{result[:watering_days]}"
  end

  test "dry humidity decreases watering interval" do
    result = ScheduleCalculator.call(
      species: @species,
      light_level: "medium",
      temperature_level: "average",
      humidity_level: "dry"
    )

    assert result[:watering_days] < 7, "Expected less than 7, got #{result[:watering_days]}"
  end

  test "returns nil feeding_days when species has none" do
    species = Species.create!(common_name: "Cactus", watering_frequency_days: 21, personality: "prickly")
    result = ScheduleCalculator.call(
      species: species,
      light_level: "medium",
      temperature_level: "average",
      humidity_level: "average"
    )

    assert_nil result[:feeding_days]
  end

  test "never returns less than 1 day" do
    species = Species.create!(common_name: "Fern", watering_frequency_days: 2, personality: "needy")
    result = ScheduleCalculator.call(
      species: species,
      light_level: "bright",
      temperature_level: "warm",
      humidity_level: "dry"
    )

    assert result[:watering_days] >= 1
  end
end
```

- [ ] **Step 5: Implement ScheduleCalculator**

Create `api/app/services/schedule_calculator.rb`:

```ruby
class ScheduleCalculator
  LIGHT_MODIFIERS = { "bright" => -0.15, "medium" => 0.0, "low" => 0.2 }.freeze
  TEMPERATURE_MODIFIERS = { "warm" => -0.1, "average" => 0.0, "cool" => 0.15 }.freeze
  HUMIDITY_MODIFIERS = { "dry" => -0.1, "average" => 0.0, "humid" => 0.15 }.freeze

  def self.call(species:, light_level:, temperature_level:, humidity_level:)
    modifier = 1.0 +
      LIGHT_MODIFIERS.fetch(light_level, 0.0) +
      TEMPERATURE_MODIFIERS.fetch(temperature_level, 0.0) +
      HUMIDITY_MODIFIERS.fetch(humidity_level, 0.0)

    watering = (species.watering_frequency_days * modifier).round
    watering = [watering, 1].max

    feeding = if species.feeding_frequency_days
      result = (species.feeding_frequency_days * modifier).round
      [result, 1].max
    end

    { watering_days: watering, feeding_days: feeding }
  end
end
```

- [ ] **Step 6: Run ScheduleCalculator tests**

```bash
docker compose exec api rails test test/services/schedule_calculator_test.rb
```

Expected: All 7 tests pass.

- [ ] **Step 7: Write Plant model tests**

Create `api/test/models/plant_test.rb`:

```ruby
require "test_helper"

class PlantTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(email: "test@example.com", name: "Test", password: "password123", password_confirmation: "password123")
    @room = @user.rooms.create!(name: "Living Room")
    @species = Species.create!(common_name: "Monstera", watering_frequency_days: 7, feeding_frequency_days: 30, personality: "dramatic")
  end

  test "valid plant" do
    plant = @room.plants.new(nickname: "Sir Plantalot", species: @species)
    assert plant.valid?
  end

  test "requires nickname" do
    plant = @room.plants.new(nickname: "", species: @species)
    assert_not plant.valid?
    assert_includes plant.errors[:nickname], "can't be blank"
  end

  test "calculates schedule on create when species is set" do
    plant = @room.plants.create!(nickname: "Sir Plantalot", species: @species)

    assert plant.calculated_watering_days.present?
    assert plant.calculated_feeding_days.present?
  end

  test "recalculates schedule when environment changes" do
    plant = @room.plants.create!(nickname: "Sir Plantalot", species: @species, light_level: "medium")
    original_days = plant.calculated_watering_days

    plant.update!(light_level: "bright", temperature_level: "warm")

    assert_not_equal original_days, plant.calculated_watering_days
  end

  test "water_status returns overdue when past due" do
    plant = @room.plants.create!(
      nickname: "Sir Plantalot",
      species: @species,
      last_watered_at: 10.days.ago,
      calculated_watering_days: 7
    )

    assert_equal :overdue, plant.water_status
  end

  test "water_status returns due_today when due" do
    plant = @room.plants.create!(
      nickname: "Sir Plantalot",
      species: @species,
      last_watered_at: 7.days.ago,
      calculated_watering_days: 7
    )

    assert_equal :due_today, plant.water_status
  end

  test "water_status returns healthy when not due" do
    plant = @room.plants.create!(
      nickname: "Sir Plantalot",
      species: @species,
      last_watered_at: 1.day.ago,
      calculated_watering_days: 7
    )

    assert_equal :healthy, plant.water_status
  end

  test "water_status returns due_soon within 2 days" do
    plant = @room.plants.create!(
      nickname: "Sir Plantalot",
      species: @species,
      last_watered_at: 6.days.ago,
      calculated_watering_days: 7
    )

    assert_equal :due_soon, plant.water_status
  end
end
```

- [ ] **Step 8: Implement Plant model**

Edit `api/app/models/plant.rb`:

```ruby
class Plant < ApplicationRecord
  belongs_to :room
  belongs_to :species, optional: true
  has_many :care_logs, dependent: :destroy
  has_many :plant_photos, dependent: :destroy

  validates :nickname, presence: true
  validates :light_level, inclusion: { in: %w[bright medium low] }
  validates :temperature_level, inclusion: { in: %w[warm average cool] }
  validates :humidity_level, inclusion: { in: %w[dry average humid] }

  before_save :calculate_schedule, if: :should_recalculate?

  def water_status
    return :unknown unless last_watered_at && calculated_watering_days

    days_since = (Time.current - last_watered_at).to_i / 1.day
    days_until = calculated_watering_days - days_since

    if days_until < 0
      :overdue
    elsif days_until == 0
      :due_today
    elsif days_until <= 2
      :due_soon
    else
      :healthy
    end
  end

  def feed_status
    return :unknown unless last_fed_at && calculated_feeding_days

    days_since = (Time.current - last_fed_at).to_i / 1.day
    days_until = calculated_feeding_days - days_since

    if days_until < 0
      :overdue
    elsif days_until == 0
      :due_today
    elsif days_until <= 3
      :due_soon
    else
      :healthy
    end
  end

  def days_until_water
    return nil unless last_watered_at && calculated_watering_days

    calculated_watering_days - ((Time.current - last_watered_at).to_i / 1.day)
  end

  def days_until_feed
    return nil unless last_fed_at && calculated_feeding_days

    calculated_feeding_days - ((Time.current - last_fed_at).to_i / 1.day)
  end

  private def should_recalculate?
    species.present? && (
      new_record? ||
      light_level_changed? ||
      temperature_level_changed? ||
      humidity_level_changed? ||
      species_id_changed?
    )
  end

  private def calculate_schedule
    result = ScheduleCalculator.call(
      species: species,
      light_level: light_level,
      temperature_level: temperature_level,
      humidity_level: humidity_level
    )

    self.calculated_watering_days = result[:watering_days]
    self.calculated_feeding_days = result[:feeding_days]
  end
end
```

- [ ] **Step 9: Run Plant model tests**

```bash
docker compose exec api rails test test/models/plant_test.rb
```

Expected: All 8 tests pass.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: Plant model with smart schedule calculation from species + environment"
```

---

## Task 8: CareLog Model & Plant Care Endpoint

**Files:**
- Create: `api/app/models/care_log.rb`
- Create: `api/db/migrate/xxx_create_care_logs.rb`
- Create: `api/app/controllers/api/v1/care_logs_controller.rb`
- Create: `api/test/models/care_log_test.rb`
- Create: `api/test/controllers/api/v1/care_logs_controller_test.rb`
- Modify: `api/config/routes.rb`

- [ ] **Step 1: Generate the CareLog model**

```bash
docker compose exec api rails generate model CareLog \
  plant:references \
  care_type:string \
  performed_at:datetime \
  notes:string
```

- [ ] **Step 2: Edit the migration**

```ruby
class CreateCareLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :care_logs do |t|
      t.references :plant, null: false, foreign_key: true
      t.string :care_type, null: false
      t.datetime :performed_at, null: false
      t.string :notes

      t.timestamps
    end

    add_index :care_logs, [:plant_id, :performed_at]
  end
end
```

- [ ] **Step 3: Run the migration**

```bash
docker compose exec api rails db:migrate
```

- [ ] **Step 4: Write CareLog model tests**

Create `api/test/models/care_log_test.rb`:

```ruby
require "test_helper"

class CareLogTest < ActiveSupport::TestCase
  setup do
    user = User.create!(email: "test@example.com", name: "Test", password: "password123", password_confirmation: "password123")
    room = user.rooms.create!(name: "Living Room")
    species = Species.create!(common_name: "Monstera", watering_frequency_days: 7, feeding_frequency_days: 30, personality: "dramatic")
    @plant = room.plants.create!(nickname: "Sir Plantalot", species: species, last_watered_at: 5.days.ago, last_fed_at: 20.days.ago)
  end

  test "valid care log" do
    log = @plant.care_logs.new(care_type: "watering", performed_at: Time.current)
    assert log.valid?
  end

  test "requires care_type" do
    log = @plant.care_logs.new(performed_at: Time.current)
    assert_not log.valid?
  end

  test "care_type must be watering or feeding" do
    log = @plant.care_logs.new(care_type: "singing", performed_at: Time.current)
    assert_not log.valid?
  end

  test "watering log updates plant last_watered_at" do
    @plant.care_logs.create!(care_type: "watering", performed_at: Time.current)
    @plant.reload

    assert_in_delta Time.current, @plant.last_watered_at, 2.seconds
  end

  test "feeding log updates plant last_fed_at" do
    @plant.care_logs.create!(care_type: "feeding", performed_at: Time.current)
    @plant.reload

    assert_in_delta Time.current, @plant.last_fed_at, 2.seconds
  end
end
```

- [ ] **Step 5: Implement CareLog model**

Edit `api/app/models/care_log.rb`:

```ruby
class CareLog < ApplicationRecord
  belongs_to :plant

  validates :care_type, presence: true, inclusion: { in: %w[watering feeding] }
  validates :performed_at, presence: true

  after_create :update_plant_timestamps

  private def update_plant_timestamps
    case care_type
    when "watering"
      plant.update!(last_watered_at: performed_at)
    when "feeding"
      plant.update!(last_fed_at: performed_at)
    end
  end
end
```

- [ ] **Step 6: Run CareLog model tests**

```bash
docker compose exec api rails test test/models/care_log_test.rb
```

Expected: All 5 tests pass.

- [ ] **Step 7: Add routes for plants and care**

Update `api/config/routes.rb`:

```ruby
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      post "register", to: "registrations#create"
      post "login", to: "sessions#create"
      delete "logout", to: "sessions#destroy"
      post "refresh", to: "tokens#create"

      resources :rooms, only: [:index, :show, :create, :update, :destroy]

      resources :plants, only: [:index, :show, :create, :update, :destroy] do
        post "care", on: :member
        resources :care_logs, only: [:index]
        resources :photos, controller: "plant_photos", only: [:index, :create, :destroy]
      end

      resources :species, only: [:show] do
        get "search", on: :collection
      end

      get "dashboard", to: "dashboard#show"

      resource :profile, only: [:show, :update] do
        patch "password", on: :member
      end
    end
  end
end
```

- [ ] **Step 8: Write plants controller test**

Create `api/test/controllers/api/v1/plants_controller_test.rb`:

```ruby
require "test_helper"

class Api::V1::PlantsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(email: "test@example.com", name: "Test", password: "password123", password_confirmation: "password123")
    @room = @user.rooms.create!(name: "Living Room")
    @species = Species.create!(common_name: "Monstera", watering_frequency_days: 7, feeding_frequency_days: 30, personality: "dramatic")
    @plant = @room.plants.create!(nickname: "Sir Plantalot", species: @species, last_watered_at: 3.days.ago)
  end

  test "index returns user plants" do
    get api_v1_plants_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal 1, json.length
    assert_equal "Sir Plantalot", json[0]["nickname"]
  end

  test "index filters by room" do
    other_room = @user.rooms.create!(name: "Bedroom")
    other_room.plants.create!(nickname: "Bedroom Plant", species: @species, last_watered_at: Time.current)

    get api_v1_plants_path(room_id: @room.id), headers: auth_headers(@user), as: :json

    json = JSON.parse(response.body)
    assert_equal 1, json.length
    assert_equal "Sir Plantalot", json[0]["nickname"]
  end

  test "show returns plant with species and status" do
    get api_v1_plant_path(@plant), headers: auth_headers(@user), as: :json

    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal "Sir Plantalot", json["nickname"]
    assert json["species"].present?
    assert json["water_status"].present?
  end

  test "create with species calculates schedule automatically" do
    post api_v1_plants_path, headers: auth_headers(@user),
      params: {
        plant: {
          room_id: @room.id,
          species_id: @species.id,
          nickname: "New Plant",
          light_level: "bright",
          temperature_level: "warm",
          humidity_level: "average"
        }
      }, as: :json

    assert_response :created
    json = JSON.parse(response.body)
    assert json["calculated_watering_days"].present?
    assert json["calculated_watering_days"] < 7, "Expected less than base 7 for bright/warm"
  end

  test "care action creates log and updates plant" do
    post care_api_v1_plant_path(@plant), headers: auth_headers(@user),
      params: { care_type: "watering" }, as: :json

    assert_response :ok
    json = JSON.parse(response.body)
    assert_in_delta Time.current.to_i, Time.parse(json["last_watered_at"]).to_i, 2
    assert_equal 1, @plant.care_logs.count
  end

  test "destroy removes plant" do
    assert_difference("Plant.count", -1) do
      delete api_v1_plant_path(@plant), headers: auth_headers(@user), as: :json
    end

    assert_response :no_content
  end
end
```

- [ ] **Step 9: Implement plants controller**

Create `api/app/controllers/api/v1/plants_controller.rb`:

```ruby
module Api
  module V1
    class PlantsController < ApplicationController
      before_action :authenticate!
      before_action :set_plant, only: [:show, :update, :destroy, :care]

      def index
        plants = current_user.plants.includes(:species, :room)
        plants = plants.where(room_id: params[:room_id]) if params[:room_id].present?

        render json: plants.map { |p| plant_summary_json(p) }
      end

      def show
        render json: plant_detail_json(@plant)
      end

      def create
        room = current_user.rooms.find_by(id: plant_params[:room_id])
        return render json: { error: "Room not found" }, status: :not_found unless room

        plant = room.plants.new(plant_params.except(:room_id))
        plant.last_watered_at ||= Time.current

        if plant.save
          render json: plant_detail_json(plant), status: :created
        else
          render json: { errors: plant.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @plant.update(plant_params.except(:room_id))
          render json: plant_detail_json(@plant)
        else
          render json: { errors: @plant.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @plant.destroy!
        head :no_content
      end

      def care
        care_type = params[:care_type]
        return render json: { error: "Invalid care type" }, status: :unprocessable_entity unless %w[watering feeding].include?(care_type)

        @plant.care_logs.create!(
          care_type: care_type,
          performed_at: Time.current,
          notes: params[:notes]
        )

        @plant.reload
        render json: plant_detail_json(@plant)
      end

      private def set_plant
        @plant = current_user.plants.includes(:species, :room).find_by(id: params[:id])
        render json: { error: "Not found" }, status: :not_found unless @plant
      end

      private def plant_params
        params.require(:plant).permit(
          :room_id, :species_id, :nickname, :notes,
          :light_level, :temperature_level, :humidity_level, :acquired_at
        )
      end

      private def plant_summary_json(plant)
        {
          id: plant.id,
          nickname: plant.nickname,
          room: { id: plant.room.id, name: plant.room.name },
          species: plant.species ? { id: plant.species.id, common_name: plant.species.common_name, personality: plant.species.personality } : nil,
          water_status: plant.water_status,
          feed_status: plant.feed_status,
          days_until_water: plant.days_until_water,
          days_until_feed: plant.days_until_feed,
          calculated_watering_days: plant.calculated_watering_days,
          last_watered_at: plant.last_watered_at
        }
      end

      private def plant_detail_json(plant)
        plant_summary_json(plant).merge(
          notes: plant.notes,
          light_level: plant.light_level,
          temperature_level: plant.temperature_level,
          humidity_level: plant.humidity_level,
          calculated_feeding_days: plant.calculated_feeding_days,
          last_fed_at: plant.last_fed_at,
          acquired_at: plant.acquired_at,
          species: plant.species ? species_json(plant.species) : nil,
          created_at: plant.created_at
        )
      end

      private def species_json(species)
        {
          id: species.id,
          common_name: species.common_name,
          scientific_name: species.scientific_name,
          light_requirement: species.light_requirement,
          humidity_preference: species.humidity_preference,
          temperature_min: species.temperature_min,
          temperature_max: species.temperature_max,
          toxicity: species.toxicity,
          difficulty: species.difficulty,
          growth_rate: species.growth_rate,
          personality: species.personality,
          description: species.description,
          care_tips: species.care_tips,
          image_url: species.image_url
        }
      end
    end
  end
end
```

- [ ] **Step 10: Implement care_logs controller**

Create `api/app/controllers/api/v1/care_logs_controller.rb`:

```ruby
module Api
  module V1
    class CareLogsController < ApplicationController
      before_action :authenticate!

      def index
        plant = current_user.plants.find_by(id: params[:plant_id])
        return render json: { error: "Not found" }, status: :not_found unless plant

        logs = plant.care_logs.order(performed_at: :desc)
        logs = logs.where(care_type: params[:type]) if params[:type].present?

        render json: logs.map { |log|
          {
            id: log.id,
            care_type: log.care_type,
            performed_at: log.performed_at,
            notes: log.notes,
            created_at: log.created_at
          }
        }
      end
    end
  end
end
```

- [ ] **Step 11: Run all plant-related tests**

```bash
docker compose exec api rails test test/controllers/api/v1/plants_controller_test.rb test/models/care_log_test.rb
```

Expected: All 11 tests pass (6 plants + 5 care log).

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: Plant CRUD, care logging, and care_logs API"
```

---

## Task 9: PlantPhoto Model & API

**Files:**
- Create: `api/app/models/plant_photo.rb`
- Create: `api/db/migrate/xxx_create_plant_photos.rb`
- Create: `api/app/controllers/api/v1/plant_photos_controller.rb`
- Create: `api/test/models/plant_photo_test.rb`
- Create: `api/test/controllers/api/v1/plant_photos_controller_test.rb`

- [ ] **Step 1: Generate the PlantPhoto model**

```bash
docker compose exec api rails generate model PlantPhoto \
  plant:references \
  caption:string \
  taken_at:datetime
```

- [ ] **Step 2: Edit the migration**

```ruby
class CreatePlantPhotos < ActiveRecord::Migration[8.0]
  def change
    create_table :plant_photos do |t|
      t.references :plant, null: false, foreign_key: true
      t.string :caption
      t.datetime :taken_at, null: false

      t.timestamps
    end

    add_index :plant_photos, [:plant_id, :taken_at]
  end
end
```

- [ ] **Step 3: Run the migration**

```bash
docker compose exec api rails db:migrate
```

- [ ] **Step 4: Write PlantPhoto model tests**

Create `api/test/models/plant_photo_test.rb`:

```ruby
require "test_helper"

class PlantPhotoTest < ActiveSupport::TestCase
  setup do
    user = User.create!(email: "test@example.com", name: "Test", password: "password123", password_confirmation: "password123")
    room = user.rooms.create!(name: "Living Room")
    @plant = room.plants.create!(nickname: "Sir Plantalot", last_watered_at: Time.current)
  end

  test "valid photo" do
    photo = @plant.plant_photos.new(taken_at: Time.current)
    assert photo.valid?
  end

  test "requires taken_at" do
    photo = @plant.plant_photos.new
    assert_not photo.valid?
    assert_includes photo.errors[:taken_at], "can't be blank"
  end

  test "orders by taken_at descending by default" do
    old = @plant.plant_photos.create!(taken_at: 1.week.ago)
    recent = @plant.plant_photos.create!(taken_at: 1.day.ago)

    photos = @plant.plant_photos.chronological
    assert_equal recent, photos.first
    assert_equal old, photos.last
  end
end
```

- [ ] **Step 5: Implement PlantPhoto model**

Edit `api/app/models/plant_photo.rb`:

```ruby
class PlantPhoto < ApplicationRecord
  belongs_to :plant
  has_one_attached :image

  validates :taken_at, presence: true

  scope :chronological, -> { order(taken_at: :desc) }
end
```

- [ ] **Step 6: Run PlantPhoto model tests**

```bash
docker compose exec api rails test test/models/plant_photo_test.rb
```

Expected: All 3 tests pass.

- [ ] **Step 7: Write plant photos controller test**

Create `api/test/controllers/api/v1/plant_photos_controller_test.rb`:

```ruby
require "test_helper"

class Api::V1::PlantPhotosControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(email: "test@example.com", name: "Test", password: "password123", password_confirmation: "password123")
    room = @user.rooms.create!(name: "Living Room")
    @plant = room.plants.create!(nickname: "Sir Plantalot", last_watered_at: Time.current)
  end

  test "index returns photos in chronological order" do
    @plant.plant_photos.create!(taken_at: 1.week.ago, caption: "Week ago")
    @plant.plant_photos.create!(taken_at: 1.day.ago, caption: "Yesterday")

    get api_v1_plant_photos_path(@plant), headers: auth_headers(@user), as: :json

    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal 2, json.length
    assert_equal "Yesterday", json[0]["caption"]
  end

  test "create uploads photo" do
    image = fixture_file_upload("test.jpg", "image/jpeg")

    post api_v1_plant_photos_path(@plant), headers: auth_headers(@user),
      params: { plant_photo: { image: image, caption: "Looking good!", taken_at: Time.current.iso8601 } }

    assert_response :created
    json = JSON.parse(response.body)
    assert_equal "Looking good!", json["caption"]
    assert json["image_url"].present?
  end

  test "destroy removes photo" do
    photo = @plant.plant_photos.create!(taken_at: Time.current)

    assert_difference("PlantPhoto.count", -1) do
      delete api_v1_plant_photo_path(@plant, photo), headers: auth_headers(@user), as: :json
    end

    assert_response :no_content
  end
end
```

Note: You'll need a test fixture image. Create a small JPEG test fixture:

```bash
docker compose exec api bash -c "mkdir -p test/fixtures/files && convert -size 100x100 xc:green test/fixtures/files/test.jpg"
```

If ImageMagick isn't available, create a minimal valid JPEG manually or use any small JPEG file renamed to `test/fixtures/files/test.jpg`.

- [ ] **Step 8: Implement plant photos controller**

Create `api/app/controllers/api/v1/plant_photos_controller.rb`:

```ruby
module Api
  module V1
    class PlantPhotosController < ApplicationController
      before_action :authenticate!
      before_action :set_plant

      def index
        photos = @plant.plant_photos.chronological

        render json: photos.map { |photo| photo_json(photo) }
      end

      def create
        photo = @plant.plant_photos.new(photo_params)

        if photo.save
          render json: photo_json(photo), status: :created
        else
          render json: { errors: photo.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        photo = @plant.plant_photos.find_by(id: params[:id])
        return render json: { error: "Not found" }, status: :not_found unless photo

        photo.destroy!
        head :no_content
      end

      private def set_plant
        @plant = current_user.plants.find_by(id: params[:plant_id])
        render json: { error: "Not found" }, status: :not_found unless @plant
      end

      private def photo_params
        params.require(:plant_photo).permit(:caption, :taken_at, :image)
      end

      private def photo_json(photo)
        {
          id: photo.id,
          caption: photo.caption,
          taken_at: photo.taken_at,
          image_url: photo.image.attached? ? rails_blob_url(photo.image, only_path: true) : nil,
          created_at: photo.created_at
        }
      end
    end
  end
end
```

- [ ] **Step 9: Run plant photos controller tests**

```bash
docker compose exec api rails test test/controllers/api/v1/plant_photos_controller_test.rb
```

Expected: All 3 tests pass.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: PlantPhoto model with photo journal upload and timeline API"
```

---

## Task 10: Species Search & Dashboard Endpoints

**Files:**
- Create: `api/app/controllers/api/v1/species_controller.rb`
- Create: `api/app/controllers/api/v1/dashboard_controller.rb`
- Create: `api/app/services/species_search_service.rb`
- Create: `api/test/controllers/api/v1/species_controller_test.rb`
- Create: `api/test/controllers/api/v1/dashboard_controller_test.rb`
- Create: `api/test/services/species_search_service_test.rb`

- [ ] **Step 1: Write SpeciesSearchService tests**

Create `api/test/services/species_search_service_test.rb`:

```ruby
require "test_helper"

class SpeciesSearchServiceTest < ActiveSupport::TestCase
  setup do
    Species.create!(common_name: "Monstera Deliciosa", scientific_name: "Monstera deliciosa", watering_frequency_days: 7, personality: "dramatic", source: "seed")
    Species.create!(common_name: "Snake Plant", scientific_name: "Dracaena trifasciata", watering_frequency_days: 14, personality: "chill", source: "seed")
  end

  test "finds local species by name" do
    results = SpeciesSearchService.call("monstera")
    assert_equal 1, results.length
    assert_equal "Monstera Deliciosa", results.first.common_name
  end

  test "returns empty array for no match" do
    results = SpeciesSearchService.call("unicorn plant")
    assert_equal [], results
  end

  test "returns empty array for blank query" do
    results = SpeciesSearchService.call("")
    assert_equal [], results
  end
end
```

- [ ] **Step 2: Implement SpeciesSearchService**

Create `api/app/services/species_search_service.rb`:

```ruby
class SpeciesSearchService
  def self.call(query)
    return [] if query.blank?

    local_results = Species.search(query).limit(10).to_a

    return local_results if local_results.any?

    # TODO: Phase 2 — fallback to Perenual API when no local results found
    # api_results = PerenualApiService.search(query)
    # api_results.map { |data| Species.find_or_create_from_api(data) }

    []
  end
end
```

- [ ] **Step 3: Run SpeciesSearchService tests**

```bash
docker compose exec api rails test test/services/species_search_service_test.rb
```

Expected: All 3 tests pass.

- [ ] **Step 4: Write species controller test**

Create `api/test/controllers/api/v1/species_controller_test.rb`:

```ruby
require "test_helper"

class Api::V1::SpeciesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(email: "test@example.com", name: "Test", password: "password123", password_confirmation: "password123")
    @species = Species.create!(
      common_name: "Monstera", scientific_name: "Monstera deliciosa",
      watering_frequency_days: 7, feeding_frequency_days: 30,
      personality: "dramatic", light_requirement: "bright_indirect",
      description: "A beautiful plant", care_tips: "Water weekly"
    )
  end

  test "search returns matching species" do
    get search_api_v1_species_index_path(q: "monstera"), headers: auth_headers(@user), as: :json

    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal 1, json.length
    assert_equal "Monstera", json[0]["common_name"]
  end

  test "show returns full species detail" do
    get api_v1_species_path(@species), headers: auth_headers(@user), as: :json

    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal "Monstera", json["common_name"]
    assert_equal "dramatic", json["personality"]
    assert_equal "bright_indirect", json["light_requirement"]
  end
end
```

- [ ] **Step 5: Implement species controller**

Create `api/app/controllers/api/v1/species_controller.rb`:

```ruby
module Api
  module V1
    class SpeciesController < ApplicationController
      before_action :authenticate!

      def search
        results = SpeciesSearchService.call(params[:q])

        render json: results.map { |s| species_summary_json(s) }
      end

      def show
        species = Species.find_by(id: params[:id])
        return render json: { error: "Not found" }, status: :not_found unless species

        render json: species_detail_json(species)
      end

      private def species_summary_json(species)
        {
          id: species.id,
          common_name: species.common_name,
          scientific_name: species.scientific_name,
          personality: species.personality,
          difficulty: species.difficulty,
          image_url: species.image_url
        }
      end

      private def species_detail_json(species)
        {
          id: species.id,
          common_name: species.common_name,
          scientific_name: species.scientific_name,
          watering_frequency_days: species.watering_frequency_days,
          feeding_frequency_days: species.feeding_frequency_days,
          light_requirement: species.light_requirement,
          humidity_preference: species.humidity_preference,
          temperature_min: species.temperature_min,
          temperature_max: species.temperature_max,
          toxicity: species.toxicity,
          difficulty: species.difficulty,
          growth_rate: species.growth_rate,
          personality: species.personality,
          description: species.description,
          care_tips: species.care_tips,
          image_url: species.image_url
        }
      end
    end
  end
end
```

- [ ] **Step 6: Run species controller tests**

```bash
docker compose exec api rails test test/controllers/api/v1/species_controller_test.rb
```

Expected: All 2 tests pass.

- [ ] **Step 7: Write dashboard controller test**

Create `api/test/controllers/api/v1/dashboard_controller_test.rb`:

```ruby
require "test_helper"

class Api::V1::DashboardControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(email: "test@example.com", name: "Test", password: "password123", password_confirmation: "password123")
    @room = @user.rooms.create!(name: "Living Room")
    @species = Species.create!(common_name: "Monstera", watering_frequency_days: 7, feeding_frequency_days: 30, personality: "dramatic")
  end

  test "returns plants needing water" do
    @room.plants.create!(nickname: "Thirsty", species: @species, last_watered_at: 10.days.ago)
    @room.plants.create!(nickname: "Happy", species: @species, last_watered_at: 1.day.ago)

    get api_v1_dashboard_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    json = JSON.parse(response.body)
    overdue = json["plants_needing_water"]
    assert_equal 1, overdue.length
    assert_equal "Thirsty", overdue[0]["nickname"]
  end

  test "returns upcoming care" do
    @room.plants.create!(nickname: "Soon", species: @species, last_watered_at: 6.days.ago)

    get api_v1_dashboard_path, headers: auth_headers(@user), as: :json

    json = JSON.parse(response.body)
    upcoming = json["upcoming_care"]
    assert upcoming.any? { |p| p["nickname"] == "Soon" }
  end

  test "returns stats" do
    @room.plants.create!(nickname: "Plant 1", species: @species, last_watered_at: Time.current)

    get api_v1_dashboard_path, headers: auth_headers(@user), as: :json

    json = JSON.parse(response.body)
    assert_equal 1, json["stats"]["total_plants"]
    assert_equal 1, json["stats"]["total_rooms"]
  end

  test "requires authentication" do
    get api_v1_dashboard_path, as: :json
    assert_response :unauthorized
  end
end
```

- [ ] **Step 8: Implement dashboard controller**

Create `api/app/controllers/api/v1/dashboard_controller.rb`:

```ruby
module Api
  module V1
    class DashboardController < ApplicationController
      before_action :authenticate!

      def show
        plants = current_user.plants.includes(:species, :room)

        needing_water = plants.select { |p| p.water_status.in?([:overdue, :due_today]) }
        needing_feeding = plants.select { |p| p.feed_status.in?([:overdue, :due_today]) }
        upcoming = plants.select { |p| p.water_status == :due_soon || p.feed_status == :due_soon }

        render json: {
          plants_needing_water: needing_water.map { |p| dashboard_plant_json(p, :water) },
          plants_needing_feeding: needing_feeding.map { |p| dashboard_plant_json(p, :feed) },
          upcoming_care: upcoming.map { |p| dashboard_plant_json(p, :upcoming) },
          stats: {
            total_plants: plants.size,
            total_rooms: current_user.rooms.count
          }
        }
      end

      private def dashboard_plant_json(plant, context)
        {
          id: plant.id,
          nickname: plant.nickname,
          room: { id: plant.room.id, name: plant.room.name },
          species: plant.species ? { common_name: plant.species.common_name, personality: plant.species.personality } : nil,
          water_status: plant.water_status,
          feed_status: plant.feed_status,
          days_until_water: plant.days_until_water,
          days_until_feed: plant.days_until_feed
        }
      end
    end
  end
end
```

- [ ] **Step 9: Run dashboard controller tests**

```bash
docker compose exec api rails test test/controllers/api/v1/dashboard_controller_test.rb
```

Expected: All 4 tests pass.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: species search, dashboard endpoint with care status calculations"
```

---

## Task 11: Profile Endpoint

**Files:**
- Create: `api/app/controllers/api/v1/profiles_controller.rb`
- Create: `api/test/controllers/api/v1/profiles_controller_test.rb`

- [ ] **Step 1: Write profiles controller test**

Create `api/test/controllers/api/v1/profiles_controller_test.rb`:

```ruby
require "test_helper"

class Api::V1::ProfilesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(email: "test@example.com", name: "Test", password: "password123", password_confirmation: "password123")
  end

  test "show returns current user" do
    get api_v1_profile_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal "test@example.com", json["email"]
    assert_equal "Test", json["name"]
  end

  test "update changes profile" do
    patch api_v1_profile_path, headers: auth_headers(@user),
      params: { user: { name: "Updated", timezone: "America/New_York" } }, as: :json

    assert_response :ok
    assert_equal "Updated", @user.reload.name
  end

  test "password change with correct current password" do
    patch password_api_v1_profile_path, headers: auth_headers(@user),
      params: { current_password: "password123", password: "newpassword1", password_confirmation: "newpassword1" }, as: :json

    assert_response :ok
    assert @user.reload.authenticate("newpassword1")
  end

  test "password change with wrong current password" do
    patch password_api_v1_profile_path, headers: auth_headers(@user),
      params: { current_password: "wrong", password: "newpassword1", password_confirmation: "newpassword1" }, as: :json

    assert_response :unprocessable_entity
  end
end
```

- [ ] **Step 2: Implement profiles controller**

Create `api/app/controllers/api/v1/profiles_controller.rb`:

```ruby
module Api
  module V1
    class ProfilesController < ApplicationController
      before_action :authenticate!

      def show
        render json: user_json(current_user)
      end

      def update
        if current_user.update(profile_params)
          render json: user_json(current_user)
        else
          render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def password
        unless current_user.authenticate(params[:current_password])
          return render json: { error: "Current password is incorrect" }, status: :unprocessable_entity
        end

        if current_user.update(password: params[:password], password_confirmation: params[:password_confirmation])
          render json: { message: "Password updated" }
        else
          render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private def profile_params
        params.require(:user).permit(:name, :email, :timezone)
      end

      private def user_json(user)
        { id: user.id, email: user.email, name: user.name, timezone: user.timezone, created_at: user.created_at }
      end
    end
  end
end
```

- [ ] **Step 3: Run profile tests**

```bash
docker compose exec api rails test test/controllers/api/v1/profiles_controller_test.rb
```

Expected: All 4 tests pass.

- [ ] **Step 4: Run full backend test suite**

```bash
docker compose exec api rails test
```

Expected: All tests pass. This completes the backend API.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: profile endpoint with password change"
```

---

## Task 12: React Foundation — API Client, Auth Context, Routing

**Files:**
- Create: `client/src/api/client.js`
- Create: `client/src/hooks/useAuth.js`
- Create: `client/src/components/ProtectedRoute.jsx`
- Create: `client/src/components/Layout.jsx`
- Modify: `client/src/App.jsx`
- Modify: `client/src/main.jsx`

- [ ] **Step 1: Create API client with auth interceptor**

Create `client/src/api/client.js`:

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          "/api/v1/refresh",
          {},
          { withCredentials: true }
        );
        setAccessToken(data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch {
        setAccessToken(null);
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 2: Create auth context and hook**

Create `client/src/hooks/useAuth.js`:

```javascript
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api, { setAccessToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/login", { email, password });
    setAccessToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (email, name, password, passwordConfirmation) => {
    const { data } = await api.post("/register", {
      user: { email, name, password, password_confirmation: passwordConfirmation },
    });
    setAccessToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.delete("/logout");
    } catch {
      // Continue logout even if server call fails
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  // Try to restore session on mount via refresh token
  useEffect(() => {
    async function restoreSession() {
      try {
        const { data } = await api.post("/refresh");
        setAccessToken(data.access_token);
        const profile = await api.get("/profile");
        setUser(profile.data);
      } catch {
        // No valid session
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

- [ ] **Step 3: Create ProtectedRoute component**

Create `client/src/components/ProtectedRoute.jsx`:

```javascript
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

- [ ] **Step 4: Create Layout component**

Create `client/src/components/Layout.jsx`:

```javascript
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-green-600">
              PlantCare
            </Link>
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link to="/rooms" className="text-gray-600 hover:text-gray-900">
              Rooms
            </Link>
            <Link to="/plants/new" className="text-gray-600 hover:text-gray-900">
              Add Plant
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <Link to="/settings" className="text-sm text-gray-600 hover:text-gray-900">
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Set up App with routing**

Edit `client/src/App.jsx`:

```javascript
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import RoomDetail from "./pages/RoomDetail";
import PlantNew from "./pages/PlantNew";
import PlantDetail from "./pages/PlantDetail";
import Settings from "./pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/rooms/:id" element={<RoomDetail />} />
              <Route path="/plants/new" element={<PlantNew />} />
              <Route path="/plants/:id" element={<PlantDetail />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 6: Update main.jsx**

Edit `client/src/main.jsx`:

```javascript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 7: Create placeholder pages**

Create each page file with a simple placeholder so the app compiles:

`client/src/pages/Login.jsx`:
```javascript
export default function Login() {
  return <div>Login page</div>;
}
```

`client/src/pages/Register.jsx`:
```javascript
export default function Register() {
  return <div>Register page</div>;
}
```

`client/src/pages/Dashboard.jsx`:
```javascript
export default function Dashboard() {
  return <div>Dashboard</div>;
}
```

`client/src/pages/Rooms.jsx`:
```javascript
export default function Rooms() {
  return <div>Rooms</div>;
}
```

`client/src/pages/RoomDetail.jsx`:
```javascript
export default function RoomDetail() {
  return <div>Room Detail</div>;
}
```

`client/src/pages/PlantNew.jsx`:
```javascript
export default function PlantNew() {
  return <div>Add Plant</div>;
}
```

`client/src/pages/PlantDetail.jsx`:
```javascript
export default function PlantDetail() {
  return <div>Plant Detail</div>;
}
```

`client/src/pages/Settings.jsx`:
```javascript
export default function Settings() {
  return <div>Settings</div>;
}
```

- [ ] **Step 8: Verify the app compiles and loads**

```bash
docker compose up -d client
```

Open http://localhost:5173 — should see the Login placeholder page.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: React foundation — API client, auth context, routing, layout"
```

---

## Task 13: Login & Register Pages

**Files:**
- Modify: `client/src/pages/Login.jsx`
- Modify: `client/src/pages/Register.jsx`

- [ ] **Step 1: Implement Login page**

Edit `client/src/pages/Login.jsx`:

```javascript
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center text-green-600 mb-8">
          PlantCare
        </h1>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Log in</h2>

          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}

          <label className="block mb-4">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded border-gray-300 border px-3 py-2 focus:border-green-500 focus:ring-green-500"
            />
          </label>

          <label className="block mb-6">
            <span className="text-sm font-medium text-gray-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded border-gray-300 border px-3 py-2 focus:border-green-500 focus:ring-green-500"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>

          <p className="text-sm text-center mt-4 text-gray-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-green-600 hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement Register page**

Edit `client/src/pages/Register.jsx`:

```javascript
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    try {
      await register(email, name, password, passwordConfirmation);
      navigate("/");
    } catch (err) {
      setErrors(err.response?.data?.errors || ["Registration failed"]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center text-green-600 mb-8">
          PlantCare
        </h1>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Create account</h2>

          {errors.length > 0 && (
            <ul className="text-red-600 text-sm mb-4">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}

          <label className="block mb-4">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded border-gray-300 border px-3 py-2 focus:border-green-500 focus:ring-green-500"
            />
          </label>

          <label className="block mb-4">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded border-gray-300 border px-3 py-2 focus:border-green-500 focus:ring-green-500"
            />
          </label>

          <label className="block mb-4">
            <span className="text-sm font-medium text-gray-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full rounded border-gray-300 border px-3 py-2 focus:border-green-500 focus:ring-green-500"
            />
          </label>

          <label className="block mb-6">
            <span className="text-sm font-medium text-gray-700">Confirm password</span>
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              className="mt-1 block w-full rounded border-gray-300 border px-3 py-2 focus:border-green-500 focus:ring-green-500"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Sign up"}
          </button>

          <p className="text-sm text-center mt-4 text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-green-600 hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify login/register flow works end-to-end**

Open http://localhost:5173/register, create an account, verify redirect to dashboard. Log out, log back in.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: login and register pages with auth flow"
```

---

## Task 14: TanStack Query Hooks

**Files:**
- Create: `client/src/hooks/usePlants.js`
- Create: `client/src/hooks/useRooms.js`
- Create: `client/src/hooks/useSpecies.js`
- Create: `client/src/hooks/useDashboard.js`

- [ ] **Step 1: Create dashboard hook**

Create `client/src/hooks/useDashboard.js`:

```javascript
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard");
      return data;
    },
  });
}
```

- [ ] **Step 2: Create rooms hooks**

Create `client/src/hooks/useRooms.js`:

```javascript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

export function useRooms() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data } = await api.get("/rooms");
      return data;
    },
  });
}

export function useRoom(id) {
  return useQuery({
    queryKey: ["rooms", id],
    queryFn: async () => {
      const { data } = await api.get(`/rooms/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (room) => {
      const { data } = await api.post("/rooms", { room });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...room }) => {
      const { data } = await api.patch(`/rooms/${id}`, { room });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/rooms/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });
}
```

- [ ] **Step 3: Create plants hooks**

Create `client/src/hooks/usePlants.js`:

```javascript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

export function usePlants(roomId) {
  return useQuery({
    queryKey: ["plants", { roomId }],
    queryFn: async () => {
      const params = roomId ? { room_id: roomId } : {};
      const { data } = await api.get("/plants", { params });
      return data;
    },
  });
}

export function usePlant(id) {
  return useQuery({
    queryKey: ["plants", id],
    queryFn: async () => {
      const { data } = await api.get(`/plants/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plant) => {
      const { data } = await api.post("/plants", { plant });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useUpdatePlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...plant }) => {
      const { data } = await api.patch(`/plants/${id}`, { plant });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeletePlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/plants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useCarePlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, careType, notes }) => {
      const { data } = await api.post(`/plants/${id}/care`, { care_type: careType, notes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function usePlantPhotos(plantId) {
  return useQuery({
    queryKey: ["plants", plantId, "photos"],
    queryFn: async () => {
      const { data } = await api.get(`/plants/${plantId}/photos`);
      return data;
    },
    enabled: !!plantId,
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ plantId, formData }) => {
      const { data } = await api.post(`/plants/${plantId}/photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plants", variables.plantId, "photos"] });
    },
  });
}

export function useCareLogs(plantId) {
  return useQuery({
    queryKey: ["plants", plantId, "careLogs"],
    queryFn: async () => {
      const { data } = await api.get(`/plants/${plantId}/care_logs`);
      return data;
    },
    enabled: !!plantId,
  });
}
```

- [ ] **Step 4: Create species hooks**

Create `client/src/hooks/useSpecies.js`:

```javascript
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";

export function useSpeciesSearch(query) {
  return useQuery({
    queryKey: ["species", "search", query],
    queryFn: async () => {
      const { data } = await api.get("/species/search", { params: { q: query } });
      return data;
    },
    enabled: query.length >= 2,
  });
}

export function useSpecies(id) {
  return useQuery({
    queryKey: ["species", id],
    queryFn: async () => {
      const { data } = await api.get(`/species/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: TanStack Query hooks for all API resources"
```

---

## Task 15: Plant Personality System

**Files:**
- Create: `client/src/personality/emotes.js`
- Create: `client/src/personality/messages.js`
- Create: `client/src/utils/careStatus.js`
- Create: `client/src/components/PlantEmote.jsx`
- Create: `client/src/components/StatusMessage.jsx`

- [ ] **Step 1: Create care status utility**

Create `client/src/utils/careStatus.js`:

```javascript
export function getEmoteState(waterStatus, feedStatus) {
  if (waterStatus === "overdue" || feedStatus === "overdue") return "wilting";
  if (waterStatus === "due_today" || feedStatus === "due_today") return "thirsty";
  if (waterStatus === "due_soon" || feedStatus === "due_soon") return "concerned";
  return "happy";
}
```

- [ ] **Step 2: Create emote definitions**

Create `client/src/personality/emotes.js`:

```javascript
const emotes = {
  happy: { emoji: "\u{1F33F}", label: "Happy and healthy" },
  thirsty: { emoji: "\u{1F4A7}", label: "Needs attention today" },
  wilting: { emoji: "\u{1F622}", label: "Overdue for care" },
  concerned: { emoji: "\u{1F914}", label: "Care coming up soon" },
  refreshed: { emoji: "\u{2728}", label: "Just cared for" },
};

export default emotes;
```

- [ ] **Step 3: Create personality message templates**

Create `client/src/personality/messages.js`:

```javascript
const messages = {
  dramatic: {
    happy: [
      "I'm THRIVING! Look at my gorgeous leaves!",
      "Everything is perfect. Don't change a thing!",
      "I feel absolutely fabulous today!",
    ],
    thirsty: [
      "I'm PARCHED! How could you forget about me?!",
      "Is anyone going to water me or should I just WILT?",
      "I'm literally dying over here! Well, almost.",
    ],
    wilting: [
      "I can't believe this. I'm actually wilting. WILTING!",
      "This is the worst day of my life. Please help me!",
      "I thought we had something special... and then you forgot me.",
    ],
    concerned: [
      "I'm getting a teensy bit worried about my water situation...",
      "Not to be dramatic, but I might need water soon. SOON!",
      "I can feel myself getting thirsty. The drama begins!",
    ],
    refreshed: [
      "AHHHH that was EXACTLY what I needed! You're the best!",
      "I feel like a whole new plant! Thank you, thank you!",
    ],
  },
  prickly: {
    happy: [
      "I'm fine. Stop staring.",
      "Everything's good. You can go now.",
      "Still here. Still thriving. No thanks to you.",
    ],
    thirsty: [
      "I guess I could use some water. If you're not too busy.",
      "Water. Today. Please.",
      "Don't make me ask twice.",
    ],
    wilting: [
      "Okay, this is getting ridiculous. Water. Now.",
      "I didn't want to say anything, but... I'm dying here.",
      "Even I have limits, you know.",
    ],
    concerned: [
      "I might need water in a couple days. No rush. Whatever.",
      "Starting to feel a bit dry. Not that I care.",
    ],
    refreshed: [
      "Fine. That was nice. Don't let it go to your head.",
      "Adequate. I suppose you want a thank you?",
    ],
  },
  chill: {
    happy: [
      "All good here. Just vibing.",
      "Life is good. No complaints.",
      "Chillin'. Growing. Living my best life.",
    ],
    thirsty: [
      "Hey, no rush, but I could use some water when you get a chance.",
      "Getting a bit dry over here. Whenever you're ready.",
      "Water would be cool. No pressure though.",
    ],
    wilting: [
      "Okay so... I'm pretty thirsty. For real this time.",
      "I don't want to stress you out, but I really need water.",
      "Help a plant out? I'm struggling a little.",
    ],
    concerned: [
      "Might need water in a day or two. Just giving you a heads up.",
      "All good for now, but keep me in mind.",
    ],
    refreshed: [
      "Nice, thanks! Back to vibing.",
      "Ahh, that hit the spot. Appreciate you.",
    ],
  },
  needy: {
    happy: [
      "You watered me! You remembered! I'm so happy!",
      "Everything is perfect. Please don't leave me.",
      "I love this spot. I love this water. I love everything!",
    ],
    thirsty: [
      "Um, hello? I'm getting really thirsty over here...",
      "Please don't forget about me! I need water!",
      "Is it just me or is it really dry in here? Help!",
    ],
    wilting: [
      "I knew it. You forgot about me. I'm wilting!",
      "Please, please, please water me! I can't take it anymore!",
      "Am I not important to you?! I NEED water!",
    ],
    concerned: [
      "I'm okay for now but... you won't forget about me, right?",
      "Just checking — you know I need water soon, right? RIGHT?",
    ],
    refreshed: [
      "Thank you thank you thank you! You DO care!",
      "I feel so loved! Best plant parent ever!",
    ],
  },
  stoic: {
    happy: [
      "Status: optimal.",
      "All systems nominal.",
      "Conditions are satisfactory.",
    ],
    thirsty: [
      "Moisture levels are declining. Water recommended.",
      "Hydration required at your earliest convenience.",
      "Water intake: overdue. Please address.",
    ],
    wilting: [
      "Warning: critical dehydration. Immediate action required.",
      "Status: struggling. Water urgently needed.",
      "Conditions have deteriorated. Please intervene.",
    ],
    concerned: [
      "Water reserves adequate for approximately 1-2 days.",
      "Preemptive watering would be advisable.",
    ],
    refreshed: [
      "Hydration restored. Thank you.",
      "Water received. Resuming growth operations.",
    ],
  },
};

export function getStatusMessage(personality, emoteState) {
  const personalityMessages = messages[personality] || messages.chill;
  const stateMessages = personalityMessages[emoteState] || personalityMessages.happy;
  return stateMessages[Math.floor(Math.random() * stateMessages.length)];
}

export default messages;
```

- [ ] **Step 4: Create PlantEmote component**

Create `client/src/components/PlantEmote.jsx`:

```javascript
import emotes from "../personality/emotes";

export default function PlantEmote({ emoteState, size = "text-4xl" }) {
  const emote = emotes[emoteState] || emotes.happy;

  return (
    <span className={size} role="img" aria-label={emote.label} title={emote.label}>
      {emote.emoji}
    </span>
  );
}
```

- [ ] **Step 5: Create StatusMessage component**

Create `client/src/components/StatusMessage.jsx`:

```javascript
import { useMemo } from "react";
import { getStatusMessage } from "../personality/messages";

export default function StatusMessage({ personality, emoteState }) {
  const message = useMemo(
    () => getStatusMessage(personality || "chill", emoteState),
    [personality, emoteState]
  );

  return <p className="text-sm text-gray-600 italic">"{message}"</p>;
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: plant personality system — emotes, status messages, 5 personality types"
```

---

## Task 16: Dashboard Page

**Files:**
- Modify: `client/src/pages/Dashboard.jsx`
- Create: `client/src/components/PlantCard.jsx`
- Create: `client/src/components/CareButton.jsx`

- [ ] **Step 1: Create CareButton component**

Create `client/src/components/CareButton.jsx`:

```javascript
import { useCarePlant } from "../hooks/usePlants";

export default function CareButton({ plantId, careType, label }) {
  const careMutation = useCarePlant();

  function handleCare() {
    careMutation.mutate({ id: plantId, careType });
  }

  return (
    <button
      onClick={handleCare}
      disabled={careMutation.isPending}
      className="px-3 py-1 text-sm rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
    >
      {careMutation.isPending ? "..." : label}
    </button>
  );
}
```

- [ ] **Step 2: Create PlantCard component**

Create `client/src/components/PlantCard.jsx`:

```javascript
import { Link } from "react-router-dom";
import PlantEmote from "./PlantEmote";
import StatusMessage from "./StatusMessage";
import CareButton from "./CareButton";
import { getEmoteState } from "../utils/careStatus";

export default function PlantCard({ plant }) {
  const emoteState = getEmoteState(plant.water_status, plant.feed_status);
  const personality = plant.species?.personality || "chill";

  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-start gap-4">
      <PlantEmote emoteState={emoteState} />
      <div className="flex-1 min-w-0">
        <Link
          to={`/plants/${plant.id}`}
          className="font-semibold text-gray-900 hover:text-green-600"
        >
          {plant.nickname}
        </Link>
        <p className="text-xs text-gray-400">
          {plant.species?.common_name} &middot; {plant.room?.name}
        </p>
        <StatusMessage personality={personality} emoteState={emoteState} />

        <div className="flex gap-2 mt-2">
          {(plant.water_status === "overdue" || plant.water_status === "due_today") && (
            <CareButton plantId={plant.id} careType="watering" label="Water" />
          )}
          {(plant.feed_status === "overdue" || plant.feed_status === "due_today") && (
            <CareButton plantId={plant.id} careType="feeding" label="Feed" />
          )}
        </div>
      </div>
      <div className="text-right text-xs text-gray-400 whitespace-nowrap">
        {plant.days_until_water != null && (
          <p>
            Water: {plant.days_until_water <= 0
              ? `${Math.abs(plant.days_until_water)}d overdue`
              : `in ${plant.days_until_water}d`}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement Dashboard page**

Edit `client/src/pages/Dashboard.jsx`:

```javascript
import { useDashboard } from "../hooks/useDashboard";
import PlantCard from "../components/PlantCard";

export default function Dashboard() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-500">Failed to load dashboard</p>;

  const { plants_needing_water, plants_needing_feeding, upcoming_care, stats } = data;
  const hasUrgent = plants_needing_water.length > 0 || plants_needing_feeding.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Today</h1>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>{stats.total_plants} plants</span>
          <span>{stats.total_rooms} rooms</span>
        </div>
      </div>

      {!hasUrgent && upcoming_care.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-700 text-lg font-medium">All plants are happy!</p>
          <p className="text-green-600 text-sm mt-1">No care tasks for today.</p>
        </div>
      )}

      {plants_needing_water.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-red-600 mb-3">
            Needs watering ({plants_needing_water.length})
          </h2>
          <div className="space-y-3">
            {plants_needing_water.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        </section>
      )}

      {plants_needing_feeding.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-orange-600 mb-3">
            Needs feeding ({plants_needing_feeding.length})
          </h2>
          <div className="space-y-3">
            {plants_needing_feeding.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        </section>
      )}

      {upcoming_care.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-yellow-600 mb-3">
            Coming up soon ({upcoming_care.length})
          </h2>
          <div className="space-y-3">
            {upcoming_care.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify dashboard works**

Register a user, create a room, add a plant via the API (or build the forms in the next tasks). Check the dashboard renders correctly with plant cards, emotes, and status messages.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: dashboard page with plant cards, emotes, and care actions"
```

---

## Task 17: Rooms Pages

**Files:**
- Modify: `client/src/pages/Rooms.jsx`
- Modify: `client/src/pages/RoomDetail.jsx`

- [ ] **Step 1: Implement Rooms list page**

Edit `client/src/pages/Rooms.jsx`:

```javascript
import { useState } from "react";
import { Link } from "react-router-dom";
import { useRooms, useCreateRoom, useDeleteRoom } from "../hooks/useRooms";

export default function Rooms() {
  const { data: rooms, isLoading } = useRooms();
  const createRoom = useCreateRoom();
  const deleteRoom = useDeleteRoom();
  const [newRoomName, setNewRoomName] = useState("");
  const [showForm, setShowForm] = useState(false);

  function handleCreate(e) {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    createRoom.mutate({ name: newRoomName.trim() }, {
      onSuccess: () => {
        setNewRoomName("");
        setShowForm(false);
      },
    });
  }

  if (isLoading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          Add Room
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 flex gap-2">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Room name"
            className="flex-1 border border-gray-300 rounded px-3 py-2"
            autoFocus
          />
          <button
            type="submit"
            disabled={createRoom.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {createRoom.isPending ? "Creating..." : "Create"}
          </button>
        </form>
      )}

      {rooms.length === 0 ? (
        <p className="text-gray-500">No rooms yet. Add one to get started!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Link
              key={room.id}
              to={`/rooms/${room.id}`}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900">{room.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {room.plants_count} {room.plants_count === 1 ? "plant" : "plants"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Implement RoomDetail page**

Edit `client/src/pages/RoomDetail.jsx`:

```javascript
import { useParams, useNavigate } from "react-router-dom";
import { useRoom, useDeleteRoom } from "../hooks/useRooms";
import { usePlants } from "../hooks/usePlants";
import PlantCard from "../components/PlantCard";

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: room, isLoading: roomLoading } = useRoom(id);
  const { data: plants, isLoading: plantsLoading } = usePlants(id);
  const deleteRoom = useDeleteRoom();

  function handleDelete() {
    if (!confirm("Delete this room? All plants in it will also be deleted.")) return;

    deleteRoom.mutate(id, {
      onSuccess: () => navigate("/rooms"),
    });
  }

  if (roomLoading || plantsLoading) return <p className="text-gray-500">Loading...</p>;
  if (!room) return <p className="text-red-500">Room not found</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
        <button
          onClick={handleDelete}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Delete room
        </button>
      </div>

      {plants.length === 0 ? (
        <p className="text-gray-500">No plants in this room yet.</p>
      ) : (
        <div className="space-y-3">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: rooms list and room detail pages"
```

---

## Task 18: Add Plant Page (with Species Search & Environment Questions)

**Files:**
- Modify: `client/src/pages/PlantNew.jsx`
- Create: `client/src/components/SpeciesSearch.jsx`
- Create: `client/src/components/EnvironmentForm.jsx`

- [ ] **Step 1: Create SpeciesSearch component**

Create `client/src/components/SpeciesSearch.jsx`:

```javascript
import { useState } from "react";
import { useSpeciesSearch } from "../hooks/useSpecies";

export default function SpeciesSearch({ onSelect, selected }) {
  const [query, setQuery] = useState("");
  const { data: results, isLoading } = useSpeciesSearch(query);
  const [open, setOpen] = useState(false);

  function handleSelect(species) {
    onSelect(species);
    setQuery(species.common_name);
    setOpen(false);
  }

  function handleClear() {
    onSelect(null);
    setQuery("");
  }

  if (selected) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded px-3 py-2">
        <span className="text-sm">
          {selected.common_name}
          {selected.scientific_name && (
            <span className="text-gray-400 ml-1">({selected.scientific_name})</span>
          )}
        </span>
        <button onClick={handleClear} className="text-red-500 text-sm ml-auto">
          Clear
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search for a plant species..."
        className="w-full border border-gray-300 rounded px-3 py-2"
      />

      {open && query.length >= 2 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading && <p className="p-3 text-sm text-gray-500">Searching...</p>}
          {results && results.length === 0 && (
            <p className="p-3 text-sm text-gray-500">No species found</p>
          )}
          {results?.map((species) => (
            <button
              key={species.id}
              onClick={() => handleSelect(species)}
              className="w-full text-left px-3 py-2 hover:bg-green-50 border-b border-gray-100 last:border-0"
            >
              <span className="font-medium">{species.common_name}</span>
              {species.scientific_name && (
                <span className="text-sm text-gray-400 ml-2">{species.scientific_name}</span>
              )}
              {species.difficulty && (
                <span className="text-xs text-gray-400 ml-2">({species.difficulty})</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create EnvironmentForm component**

Create `client/src/components/EnvironmentForm.jsx`:

```javascript
const options = {
  light_level: [
    { value: "bright", label: "Bright", desc: "Direct or bright indirect sunlight" },
    { value: "medium", label: "Medium", desc: "Some natural light, not direct" },
    { value: "low", label: "Low", desc: "Little natural light" },
  ],
  temperature_level: [
    { value: "warm", label: "Warm", desc: "Above 22\u00B0C / 72\u00B0F" },
    { value: "average", label: "Average", desc: "18-22\u00B0C / 64-72\u00B0F" },
    { value: "cool", label: "Cool", desc: "Below 18\u00B0C / 64\u00B0F" },
  ],
  humidity_level: [
    { value: "humid", label: "Humid", desc: "Bathroom, near humidifier" },
    { value: "average", label: "Average", desc: "Normal room humidity" },
    { value: "dry", label: "Dry", desc: "Near heater, air-conditioned" },
  ],
};

export default function EnvironmentForm({ values, onChange }) {
  return (
    <div className="space-y-6">
      {Object.entries(options).map(([field, fieldOptions]) => (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field === "light_level" && "How much light does this spot get?"}
            {field === "temperature_level" && "How warm is it generally?"}
            {field === "humidity_level" && "What's the humidity like?"}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {fieldOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ ...values, [field]: option.value })}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  values[field] === option.value
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="block font-medium text-sm">{option.label}</span>
                <span className="block text-xs text-gray-500 mt-1">{option.desc}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Implement PlantNew page**

Edit `client/src/pages/PlantNew.jsx`:

```javascript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRooms } from "../hooks/useRooms";
import { useCreatePlant } from "../hooks/usePlants";
import SpeciesSearch from "../components/SpeciesSearch";
import EnvironmentForm from "../components/EnvironmentForm";

export default function PlantNew() {
  const navigate = useNavigate();
  const { data: rooms, isLoading: roomsLoading } = useRooms();
  const createPlant = useCreatePlant();

  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [roomId, setRoomId] = useState("");
  const [species, setSpecies] = useState(null);
  const [environment, setEnvironment] = useState({
    light_level: "medium",
    temperature_level: "average",
    humidity_level: "average",
  });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function handleNext() {
    if (step === 1 && (!nickname.trim() || !roomId)) {
      setError("Give your plant a name and pick a room");
      return;
    }
    setError("");
    setStep(step + 1);
  }

  function handleBack() {
    setStep(step - 1);
  }

  async function handleSubmit() {
    setError("");
    createPlant.mutate(
      {
        nickname: nickname.trim(),
        room_id: roomId,
        species_id: species?.id || null,
        notes: notes.trim() || null,
        ...environment,
      },
      {
        onSuccess: (data) => navigate(`/plants/${data.id}`),
        onError: (err) => setError(err.response?.data?.errors?.join(", ") || "Failed to add plant"),
      }
    );
  }

  if (roomsLoading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add a plant</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {step === 1 && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">What do you call your plant?</span>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Sir Plantalot"
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              autoFocus
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Which room is it in?</span>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Select a room</option>
              {rooms?.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>

          <button onClick={handleNext} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">What kind of plant is it?</span>
          </label>
          <SpeciesSearch onSelect={setSpecies} selected={species} />
          <p className="text-xs text-gray-400">
            This helps us set up the right care schedule. You can skip if you're not sure.
          </p>

          <div className="flex gap-3">
            <button onClick={handleBack} className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50">
              Back
            </button>
            <button onClick={handleNext} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Tell us about the environment so we can calculate the best care schedule.
          </p>
          <EnvironmentForm values={environment} onChange={setEnvironment} />

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Any notes?</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes about your plant..."
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </label>

          <div className="flex gap-3">
            <button onClick={handleBack} className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50">
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={createPlant.isPending}
              className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {createPlant.isPending ? "Adding..." : "Add Plant"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify add plant flow works end-to-end**

1. Create a room first via the Rooms page
2. Go to Add Plant
3. Step 1: name + room
4. Step 2: search for a species (try "monstera")
5. Step 3: environment questions + submit
6. Verify redirect to plant detail and schedule was calculated

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add plant page with species search and environment questions"
```

---

## Task 19: Plant Detail Page

**Files:**
- Modify: `client/src/pages/PlantDetail.jsx`
- Create: `client/src/components/PhotoUpload.jsx`
- Create: `client/src/components/PhotoTimeline.jsx`

- [ ] **Step 1: Create PhotoUpload component**

Create `client/src/components/PhotoUpload.jsx`:

```javascript
import { useState, useRef } from "react";
import { useUploadPhoto } from "../hooks/usePlants";

export default function PhotoUpload({ plantId }) {
  const [caption, setCaption] = useState("");
  const fileRef = useRef();
  const uploadPhoto = useUploadPhoto();

  function handleSubmit(e) {
    e.preventDefault();
    const file = fileRef.current.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("plant_photo[image]", file);
    formData.append("plant_photo[caption]", caption);
    formData.append("plant_photo[taken_at]", new Date().toISOString());

    uploadPhoto.mutate(
      { plantId, formData },
      {
        onSuccess: () => {
          setCaption("");
          fileRef.current.value = "";
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input type="file" ref={fileRef} accept="image/*" className="text-sm" />
      <input
        type="text"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption (optional)"
        className="border border-gray-300 rounded px-3 py-1 text-sm"
      />
      <button
        type="submit"
        disabled={uploadPhoto.isPending}
        className="self-start px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {uploadPhoto.isPending ? "Uploading..." : "Add Photo"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create PhotoTimeline component**

Create `client/src/components/PhotoTimeline.jsx`:

```javascript
import { usePlantPhotos } from "../hooks/usePlants";

export default function PhotoTimeline({ plantId }) {
  const { data: photos, isLoading } = usePlantPhotos(plantId);

  if (isLoading) return <p className="text-sm text-gray-500">Loading photos...</p>;
  if (!photos || photos.length === 0) return <p className="text-sm text-gray-400">No photos yet</p>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {photos.map((photo) => (
        <div key={photo.id} className="bg-gray-100 rounded-lg overflow-hidden">
          {photo.image_url && (
            <img
              src={photo.image_url}
              alt={photo.caption || "Plant photo"}
              className="w-full h-32 object-cover"
            />
          )}
          <div className="p-2">
            {photo.caption && <p className="text-xs text-gray-700">{photo.caption}</p>}
            <p className="text-xs text-gray-400">
              {new Date(photo.taken_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Implement PlantDetail page**

Edit `client/src/pages/PlantDetail.jsx`:

```javascript
import { useParams, useNavigate } from "react-router-dom";
import { usePlant, useDeletePlant, useCareLogs } from "../hooks/usePlants";
import PlantEmote from "../components/PlantEmote";
import StatusMessage from "../components/StatusMessage";
import CareButton from "../components/CareButton";
import PhotoUpload from "../components/PhotoUpload";
import PhotoTimeline from "../components/PhotoTimeline";
import { getEmoteState } from "../utils/careStatus";

export default function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: plant, isLoading } = usePlant(id);
  const { data: careLogs } = useCareLogs(id);
  const deletePlant = useDeletePlant();

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!plant) return <p className="text-red-500">Plant not found</p>;

  const emoteState = getEmoteState(plant.water_status, plant.feed_status);
  const personality = plant.species?.personality || "chill";

  function handleDelete() {
    if (!confirm(`Delete ${plant.nickname}?`)) return;
    deletePlant.mutate(id, { onSuccess: () => navigate("/") });
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <PlantEmote emoteState={emoteState} size="text-5xl" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{plant.nickname}</h1>
          <p className="text-gray-500">
            {plant.species?.common_name}
            {plant.species?.scientific_name && (
              <span className="italic"> ({plant.species.scientific_name})</span>
            )}
          </p>
          <StatusMessage personality={personality} emoteState={emoteState} />
        </div>
        <button onClick={handleDelete} className="text-sm text-red-500 hover:text-red-700">
          Delete
        </button>
      </div>

      {/* Care actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Care</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Watering</p>
            <p className="font-medium">
              Every {plant.calculated_watering_days} days
              {plant.days_until_water != null && (
                <span className="text-gray-400 ml-1">
                  ({plant.days_until_water <= 0
                    ? `${Math.abs(plant.days_until_water)}d overdue`
                    : `in ${plant.days_until_water}d`})
                </span>
              )}
            </p>
            <CareButton plantId={plant.id} careType="watering" label="Water now" />
          </div>
          {plant.calculated_feeding_days && (
            <div>
              <p className="text-gray-500">Feeding</p>
              <p className="font-medium">
                Every {plant.calculated_feeding_days} days
                {plant.days_until_feed != null && (
                  <span className="text-gray-400 ml-1">
                    ({plant.days_until_feed <= 0
                      ? `${Math.abs(plant.days_until_feed)}d overdue`
                      : `in ${plant.days_until_feed}d`})
                  </span>
                )}
              </p>
              <CareButton plantId={plant.id} careType="feeding" label="Feed now" />
            </div>
          )}
        </div>
      </div>

      {/* Species info */}
      {plant.species && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">About {plant.species.common_name}</h2>
          <p className="text-sm text-gray-600 mb-3">{plant.species.description}</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {plant.species.light_requirement && (
              <p><span className="text-gray-500">Light:</span> {plant.species.light_requirement}</p>
            )}
            {plant.species.humidity_preference && (
              <p><span className="text-gray-500">Humidity:</span> {plant.species.humidity_preference}</p>
            )}
            {plant.species.difficulty && (
              <p><span className="text-gray-500">Difficulty:</span> {plant.species.difficulty}</p>
            )}
            {plant.species.toxicity && (
              <p><span className="text-gray-500">Toxicity:</span> {plant.species.toxicity}</p>
            )}
            {plant.species.growth_rate && (
              <p><span className="text-gray-500">Growth:</span> {plant.species.growth_rate}</p>
            )}
          </div>
          {plant.species.care_tips && (
            <p className="text-sm text-gray-600 mt-3 border-t pt-3">{plant.species.care_tips}</p>
          )}
        </div>
      )}

      {/* Photo journal */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Photo Journal</h2>
        <PhotoUpload plantId={plant.id} />
        <div className="mt-4">
          <PhotoTimeline plantId={plant.id} />
        </div>
      </div>

      {/* Care history */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Care History</h2>
        {careLogs && careLogs.length > 0 ? (
          <ul className="space-y-2">
            {careLogs.slice(0, 20).map((log) => (
              <li key={log.id} className="flex items-center gap-3 text-sm">
                <span className={log.care_type === "watering" ? "text-blue-500" : "text-orange-500"}>
                  {log.care_type === "watering" ? "\u{1F4A7}" : "\u{1F33F}"}
                </span>
                <span className="text-gray-700 capitalize">{log.care_type}</span>
                <span className="text-gray-400 ml-auto">
                  {new Date(log.performed_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">No care history yet</p>
        )}
      </div>

      {/* Notes */}
      {plant.notes && (
        <div className="bg-white rounded-lg shadow p-4 mt-6">
          <h2 className="font-semibold text-gray-900 mb-2">Notes</h2>
          <p className="text-sm text-gray-600">{plant.notes}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify plant detail page**

Navigate to a plant detail page. Verify: emote, status message, care buttons, species info, photo upload, care history all render correctly.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: plant detail page with species info, photo journal, and care history"
```

---

## Task 20: Settings Page

**Files:**
- Modify: `client/src/pages/Settings.jsx`

- [ ] **Step 1: Implement Settings page**

Edit `client/src/pages/Settings.jsx`:

```javascript
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../api/client";

export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [timezone, setTimezone] = useState(user?.timezone || "UTC");
  const [profileMsg, setProfileMsg] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  async function handleProfile(e) {
    e.preventDefault();
    try {
      await api.patch("/profile", { user: { name, email, timezone } });
      setProfileMsg("Profile updated");
    } catch (err) {
      setProfileMsg(err.response?.data?.errors?.join(", ") || "Update failed");
    }
  }

  async function handlePassword(e) {
    e.preventDefault();
    try {
      await api.patch("/profile/password", {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setPasswordMsg("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg(err.response?.data?.error || err.response?.data?.errors?.join(", ") || "Failed");
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <form onSubmit={handleProfile} className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Profile</h2>

        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">Timezone</span>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="UTC">UTC</option>
            <option value="Europe/London">London</option>
            <option value="America/New_York">New York</option>
            <option value="America/Chicago">Chicago</option>
            <option value="America/Denver">Denver</option>
            <option value="America/Los_Angeles">Los Angeles</option>
            <option value="Asia/Tokyo">Tokyo</option>
            <option value="Australia/Sydney">Sydney</option>
          </select>
        </label>

        {profileMsg && <p className="text-sm text-green-600 mb-3">{profileMsg}</p>}

        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Save
        </button>
      </form>

      <form onSubmit={handlePassword} className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>

        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">Confirm new password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </label>

        {passwordMsg && <p className="text-sm mb-3">{passwordMsg}</p>}

        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Change Password
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verify settings page**

Navigate to /settings. Test profile update and password change.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: settings page with profile update and password change"
```

---

## Task 21: Final Integration & Cleanup

**Files:**
- Various cleanup across both `api/` and `client/`

- [ ] **Step 1: Remove default Vite boilerplate**

Delete any remaining Vite default files that aren't needed:
- `client/src/App.css` (if it exists — we're using Tailwind)
- `client/src/assets/react.svg` (if it exists)
- Any other Vite placeholder content

- [ ] **Step 2: Run full backend test suite**

```bash
docker compose exec api rails test
```

Expected: All tests pass.

- [ ] **Step 3: Full end-to-end manual test**

Walk through the complete user journey:
1. Register at /register
2. Create a room on /rooms
3. Add a plant on /plants/new (search species, answer environment questions)
4. See the plant on the dashboard with emote and personality message
5. Water the plant via the dashboard care button
6. View plant detail page — species info, care history updated
7. Upload a photo on the plant detail page
8. Check settings page — update profile
9. Log out and log back in

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: cleanup boilerplate and verify full integration"
```

- [ ] **Step 5: Run all services and verify Docker Compose health**

```bash
docker compose down
docker compose up -d
docker compose ps
```

Expected: All 5 services (api, client, db, redis, sidekiq) running.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: PlantCare MVP complete

Rails 8 API + React frontend with:
- JWT auth (access + refresh tokens)
- Rooms and plant management
- Smart schedule calculation from species + environment
- Plant personality system with 5 personality types
- Photo journal with timeline
- Care logging and dashboard
- Species database with 15 seeded plants
- Docker Compose development environment"
```
