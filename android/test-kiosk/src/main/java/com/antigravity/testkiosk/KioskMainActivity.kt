package com.antigravity.testkiosk

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.antigravity.testkiosk.databinding.ActivityKioskMainBinding

class KioskMainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityKioskMainBinding
    private var totalAmount = 0
    private var totalItems = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityKioskMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupMenuButtons()
        setupDebugButtons()
    }

    private fun setupMenuButtons() {
        binding.btnAddGgodle.setOnClickListener { addItem("꼬들목살", 16000) }
        binding.btnAddBeefRib.setOnClickListener { addItem("소생갈비살", 21000) }
        binding.btnAddHangjeong.setOnClickListener { addItem("항정살", 17000) }
        binding.btnAddSamgyeop.setOnClickListener { addItem("숙성 삼겹살", 15000) }

        binding.btnKioskOrder.setOnClickListener {
            if (totalItems == 0) {
                Toast.makeText(this, "먼저 메뉴를 담아주세요.", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "주문이 완료되었습니다! (총 ${formatPrice(totalAmount)})", Toast.LENGTH_LONG).show()
                totalAmount = 0
                totalItems = 0
                updateCartUI()
            }
        }

        binding.btnDismissAlert.setOnClickListener {
            binding.kioskAlertBackdrop.visibility = View.GONE
        }
    }

    private fun addItem(name: String, price: Int) {
        totalAmount += price
        totalItems += 1
        updateCartUI()
        Toast.makeText(this, "$name 담기 완료", Toast.LENGTH_SHORT).show()
    }

    private fun updateCartUI() {
        if (totalItems > 0) {
            binding.tvCartSummary.text = "선택된 메뉴: 총 ${totalItems}개 / ${formatPrice(totalAmount)}"
            binding.btnKioskOrder.text = "주문하기 (${formatPrice(totalAmount)})"
        } else {
            binding.tvCartSummary.text = "장바구니가 비어 있습니다."
            binding.btnKioskOrder.text = "주문하기 (총 0원)"
        }
    }

    private fun formatPrice(price: Int): String {
        return "%,d원".format(price)
    }

    private fun setupDebugButtons() {
        // Trigger Standard Error
        binding.btnTriggerNormalError.setOnClickListener {
            binding.tvAlertTitle.text = "키오스크 통신 장애"
            binding.tvAlertMessage.text = "서버에 접속이 끊겼습니다"
            binding.kioskAlertBackdrop.visibility = View.VISIBLE
        }

        // Trigger Variation Error with newlines and spaces
        binding.btnTriggerVariantError.setOnClickListener {
            binding.tvAlertTitle.text = "네트워크 연결 중단"
            binding.tvAlertMessage.text = "서버에\n\n접속이   끊겼습니다"
            binding.kioskAlertBackdrop.visibility = View.VISIBLE
        }

        // Trigger Normal Message (Testing false positives)
        binding.btnTriggerNormalMsg.setOnClickListener {
            binding.tvAlertTitle.text = "정상 작동 안내"
            binding.tvAlertMessage.text = "키오스크 서버와 원활히 통신 중입니다."
            binding.kioskAlertBackdrop.visibility = View.VISIBLE
        }
    }
}
