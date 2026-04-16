# frozen_string_literal: true

module Api
  module V1
    module Onboarding
      class CompletionsController < Api::V1::BaseController
        def create
          current_user.complete_onboarding!
          render json: current_user, status: :created
        end
      end
    end
  end
end
