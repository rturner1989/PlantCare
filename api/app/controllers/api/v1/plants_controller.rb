# frozen_string_literal: true

module Api
  module V1
    class PlantsController < BaseController
      before_action :set_plant, only: [:show, :update, :destroy]
      before_action :set_space, only: [:create]

      def index
        plants = current_user.plants.includes(:species, :space).in_space(params[:space_id])

        render json: plants
      end

      def show
        render json: @plant
      end

      def create
        plant = @space.plants.new(plant_params)

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

      private def set_space
        @space = current_user.spaces.find_by(id: params.dig(:plant, :space_id))
        render json: { error: 'Space not found' }, status: :not_found unless @space
      end

      private def set_plant
        @plant = current_user.plants.includes(:species, :space).find_by(id: params[:id])
        render json: { error: 'Not found' }, status: :not_found unless @plant
      end

      private def plant_params
        params.expect(plant: [:species_id, :nickname, :notes, :acquired_at, :last_watered_at, :last_fed_at])
      end
    end
  end
end
