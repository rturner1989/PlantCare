Rails.application.routes.draw do
  require "sidekiq/web"                                                                               

  Sidekiq::Web.use(ActionDispatch::Cookies)                                                             
  Sidekiq::Web.use(ActionDispatch::Session::CookieStore, key: "_sidekiq_session")                       
  mount Sidekiq::Web => "/sidekiq"                                                                      
                                                                                                        
  namespace :api do                                                                                     
    namespace :v1 do                                                                           
    end                                                                                                 
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
