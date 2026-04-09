# frozen_string_literal: true

module Api
  module V1
    module Plants
      class PlantScopedController < Api::V1::BaseController
        before_action :set_plant

        private def set_plant
          @plant = current_user.plants.find_by(id: params[:plant_id])
          render json: { error: 'Not found' }, status: :not_found unless @plant
        end
      end
    end
  end
end
