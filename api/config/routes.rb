# frozen_string_literal: true

Rails.application.routes.draw do
  require 'sidekiq/web'

  Sidekiq::Web.use(ActionDispatch::Cookies)
  Sidekiq::Web.use(ActionDispatch::Session::CookieStore, key: '_sidekiq_session')
  mount Sidekiq::Web => '/sidekiq'

  namespace :api do
    namespace :v1 do
      resource :registration, only: [:create]
      resource :session, only: [:create, :destroy]
      resource :token, only: [:create]

      resources :rooms, only: [:index, :show, :create, :update, :destroy]
      resources :plants, only: [:index, :show, :create, :update, :destroy] do
        scope module: :plants do
          resources :care_logs, only: [:index, :create]
          resources :plant_photos, only: [:index, :create, :destroy]
        end
      end
      resources :species, only: [:index, :show]

      resource :dashboard, only: [:show], controller: 'dashboard'
    end
  end

  get 'up' => 'rails/health#show', as: :rails_health_check
end
