# frozen_string_literal: true

require 'test_helper'

class PlantPhotoTest < ActiveSupport::TestCase
  include ActionDispatch::TestProcess::FixtureFile

  setup do
    @plant = plants(:sir_plantalot)
  end

  test 'valid photo with image attached' do
    photo = build_photo
    assert photo.valid?
  end

  test 'requires image' do
    photo = @plant.plant_photos.new
    assert_not photo.valid?
    assert_includes photo.errors[:image], "can't be blank"
  end

  test 'defaults taken_at to now when not specified' do
    photo = build_photo
    photo.save!

    assert_in_delta Time.current, photo.taken_at, 2.seconds
  end

  test 'accepts custom taken_at' do
    time = 1.week.ago
    photo = build_photo(taken_at: time)
    photo.save!

    assert_in_delta time, photo.taken_at, 2.seconds
  end

  test 'accepts caption' do
    photo = build_photo(caption: 'Looking good!')
    photo.save!

    assert_equal 'Looking good!', photo.caption
  end

  test 'chronological scope orders by taken_at descending' do
    @plant.plant_photos.create!(
      taken_at: 1.week.ago,
      image: fixture_image
    )
    @plant.plant_photos.create!(
      taken_at: 1.day.ago,
      image: fixture_image
    )

    photos = @plant.plant_photos.chronological
    assert photos.first.taken_at > photos.last.taken_at
  end

  test 'destroying plant destroys photos' do
    build_photo.save!

    assert_difference('PlantPhoto.count', -1) do
      @plant.destroy
    end
  end

  private def build_photo(**attrs)
    @plant.plant_photos.new(image: fixture_image, **attrs)
  end

  private def fixture_image
    fixture_file_upload('test_plant.jpg', 'image/jpeg')
  end
end
