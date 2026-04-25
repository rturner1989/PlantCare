# frozen_string_literal: true

module Api
  module V1
    class ProfilesController < BaseController
      def show
        render json: current_user
      end

      def update
        if current_user.update(profile_params)
          render json: current_user
        else
          render json: { errors: current_user.errors.messages }, status: :unprocessable_content
        end
      end

      private def profile_params
        params.expect(user: [:name, :email, :timezone, :onboarding_intent, :onboarding_step_reached])
      end
    end
  end
end
