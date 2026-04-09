# frozen_string_literal: true

module Api
  module V1
    class DashboardController < BaseController
      def show
        plants = current_user.plants.includes(:species, :room)

        render json: {
          plants_needing_water: plants.select { |p| p.water_status.in?([:overdue, :due_today]) },
          plants_needing_feeding: plants.select { |p| p.feed_status.in?([:overdue, :due_today]) },
          upcoming_care: plants.select { |p| p.water_status == :due_soon || p.feed_status == :due_soon },
          stats: {
            total_plants: plants.size,
            total_rooms: current_user.rooms.count
          }
        }
      end
    end
  end
end
