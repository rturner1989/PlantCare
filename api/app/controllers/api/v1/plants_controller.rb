# frozen_string_literal: true

module Api
  module V1
    class PlantsController < BaseController
      before_action :set_plant, only: [:show, :update, :destroy]
      before_action :set_room, only: [:create]

      def index
        plants = current_user.plants.includes(:species, :room)
        plants = plants.where(room_id: params[:room_id]) if params[:room_id].present?

        render json: plants
      end

      def show
        render json: @plant
      end

      def create
        plant = @room.plants.new(plant_params)

        if plant.save
          render json: plant, status: :created
        else
          render json: { errors: plant.errors.messages }, status: :unprocessable_content
        end
      end

      def update
        if @plant.update(plant_params)
          render json: @plant
        else
          render json: { errors: @plant.errors.messages }, status: :unprocessable_content
        end
      end

      def destroy
        @plant.destroy!
        head :no_content
      end

      private def set_room
        @room = current_user.rooms.find_by(id: params.dig(:plant, :room_id))
        render json: { error: 'Room not found' }, status: :not_found unless @room
      end

      private def set_plant
        @plant = current_user.plants.includes(:species, :room).find_by(id: params[:id])
        render json: { error: 'Not found' }, status: :not_found unless @plant
      end

      private def plant_params
        params.expect(plant: [:species_id, :nickname, :notes,
                              :light_level, :temperature_level, :humidity_level, :acquired_at])
      end
    end
  end
end
