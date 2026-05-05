# frozen_string_literal: true

module Api
  module V1
    module Achievements
      # Splash queue — splash-surface achievements with no seen_at.
      # Client polls this on AppLayout mount and renders an overlay for
      # any entries. Singular resource (one queue per user).
      class UnseenController < BaseController
        def show
          achievements = current_user.achievements.unseen_splash.recent
          render json: { achievements: achievements.as_json }
        end
      end
    end
  end
end
