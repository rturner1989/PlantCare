# frozen_string_literal: true

module Api
  module V1
    module Plants
      class PlantPhotosController < PlantScopedController
        before_action :set_photo, only: [:destroy]

        def index
          render json: @plant.plant_photos.chronological
        end

        def create
          photo = @plant.plant_photos.new(photo_params)

          if photo.save
            render json: photo, status: :created
          else
            render json: { errors: photo.errors.messages }, status: :unprocessable_content
          end
        end

        def destroy
          @photo.destroy!
          head :no_content
        end

        private def set_photo
          @photo = @plant.plant_photos.find_by(id: params[:id])
          render json: { error: 'Not found' }, status: :not_found unless @photo
        end

        private def photo_params
          params.expect(plant_photo: [:caption, :taken_at, :image])
        end
      end
    end
  end
end
