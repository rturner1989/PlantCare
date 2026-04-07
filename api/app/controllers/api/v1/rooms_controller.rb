# frozen_string_literal: true

module Api
  module V1
    class RoomsController < BaseController
      before_action :set_room, only: [:show, :update, :destroy]

      def index
        render json: current_user.rooms
      end

      def show
        render json: @room
      end

      def create
        room = current_user.rooms.new(room_params)
        if room.save
          render json: room, status: :created
        else
          render json: { errors: room.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        if @room.update(room_params)
          render json: @room
        else
          render json: { errors: @room.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        @room.destroy!
        head :no_content
      end

      private def set_room
        @room = current_user.rooms.find_by(id: params[:id])
        render json: { error: 'Not found' }, status: :not_found unless @room
      end

      private def room_params
        params.expect(room: [:name, :icon])
      end
    end
  end
end
