# frozen_string_literal: true

module Api
  module V1
    module Profile
      class PasswordsController < Api::V1::BaseController
        def update
          unless current_user.authenticate(params[:current_password])
            return render json: { error: 'Current password is incorrect' }, status: :unprocessable_content
          end

          if current_user.update(password_params)
            render json: { message: 'Password updated' }
          else
            render json: { errors: current_user.errors.full_messages }, status: :unprocessable_content
          end
        end

        private def password_params
          params.expect(user: [:password, :password_confirmation])
        end
      end
    end
  end
end
