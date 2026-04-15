# frozen_string_literal: true

module Api
  module V1
    class RegistrationsController < AuthController
      def create
        user = User.new(registration_params)

        if user.save
          render json: issue_tokens(user), status: :created
        else
          render json: { errors: user.errors.messages }, status: :unprocessable_content
        end
      end

      private def registration_params
        params.expect(user: [:email, :name, :password, :password_confirmation])
      end
    end
  end
end
