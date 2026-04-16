# frozen_string_literal: true

module Api
  module V1
    class PasswordResetsController < ApplicationController
      # Unauthenticated — the whole point is "I can't log in". We bypass
      # BaseController's before_action :authenticate! by inheriting from
      # ApplicationController directly.

      # Always responds 202 regardless of whether the email matches a user.
      # Leaking user-existence here would make this endpoint an oracle for
      # enumerating registered accounts.
      #
      # TODO(security): throttle this endpoint via Rack::Attack once the
      # gem is added to the stack — 3 per IP per hour + 3 per email per
      # hour. Cheap to abuse as-is (fire-and-forget email + token
      # generation), and the "no user enumeration" guarantee above means
      # attackers can't tell their probe flooded the backend.
      def create
        user = User.find_by_normalized_email(params.dig(:password_reset, :email))

        if user
          raw_token, _record = PasswordResetToken.generate(user)
          PasswordResetMailer.reset_instructions(user, raw_token).deliver_later
        end

        render json: { message: "If an account exists for that email, we've sent you a reset link." },
               status: :accepted
      end

      def update
        token = PasswordResetToken.find_by_raw_token(params[:id])
        return render_expired unless token&.usable?

        user = token.user
        if user.update(password_params)
          token.consume!
          render json: { message: 'Password updated — you can log in now.' }
        else
          render json: { errors: user.errors.messages }, status: :unprocessable_content
        end
      end

      private def password_params
        params.expect(password_reset: [:password, :password_confirmation])
      end

      private def render_expired
        render json: { error: 'That reset link has expired or already been used. Request a new one.' },
               status: :gone
      end
    end
  end
end
