# frozen_string_literal: true

# Controller hierarchy:
#
#   ApplicationController (cookies, authenticatable concern — no auth enforced)
#     ├── Api::V1::BaseController (before_action :authenticate! — all protected resources)
#     │   ├── RoomsController
#     │   ├── PlantsController
#     │   ├── SpeciesController
#     │   ├── DashboardController
#     │   ├── ProfilesController
#     │   │
#     │   ├── Api::V1::Profile::PasswordsController (nested password resource)
#     │   │
#     │   └── Api::V1::Plants::PlantScopedController (before_action :set_plant — nested plant resources)
#     │       ├── CareLogsController
#     │       └── PlantPhotosController
#     │
#     ├── Api::V1::AuthController (shared token issuance + user JSON — unauthenticated)
#     │   ├── RegistrationsController (POST /registration)
#     │   └── SessionsController (POST/DELETE /session)
#     │
#     └── Api::V1::TokensController (refresh token exchange — standalone, unauthenticated)
#
class ApplicationController < ActionController::API
  include ActionController::Cookies
  include Authenticatable
end
